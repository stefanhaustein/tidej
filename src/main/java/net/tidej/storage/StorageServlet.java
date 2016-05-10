package net.tidej.storage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;

import javax.servlet.http.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Text;

@SuppressWarnings("serial")
public class StorageServlet extends HttpServlet {
  static final String KIND_CODE = "Code";

  static final String KEY_CMD = "cmd";

  static final String FIELD_CONTENT = "content";

  static final String FIELD_ID = "id";
  static final String FIELD_REV = "rev";
  static final String FIELD_FORKED_FROM = "forked_from";
  static final String FIELD_SECRET = "secret";

  static final String FIELD_TIMESTAMP = "timestamp";
  static final String FIELD_PATH = "path";
  static final String FIELD_NAME = "name";  // Name of the project (corresponds to id)
  static final String FIELD_SIZE = "size";
  static final String FIELD_TAG = "tag";

  static final Set<String> FILTER_WHITELIST = new HashSet<>();
  static final Set<String> WRITE_WHITELIST = new HashSet<>();
  static final Set<String> RETURN_WHITELIST = new HashSet<>();

  static {
    FILTER_WHITELIST.add(FIELD_ID);
    FILTER_WHITELIST.add(FIELD_PATH);
    FILTER_WHITELIST.add(FIELD_REV);
    FILTER_WHITELIST.add(FIELD_TAG);

    WRITE_WHITELIST.add(FIELD_TIMESTAMP);
    WRITE_WHITELIST.add(FIELD_NAME);
    WRITE_WHITELIST.add(FIELD_PATH);
    WRITE_WHITELIST.add(FIELD_SIZE);
    WRITE_WHITELIST.add(FIELD_TAG);

    RETURN_WHITELIST.add(FIELD_ID);
    RETURN_WHITELIST.add(FIELD_PATH);
    RETURN_WHITELIST.add(FIELD_REV);
    RETURN_WHITELIST.add(FIELD_SIZE);
    RETURN_WHITELIST.add(FIELD_TAG);
    RETURN_WHITELIST.add(FIELD_TIMESTAMP);
    RETURN_WHITELIST.add(FIELD_FORKED_FROM);
  }

  DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
  Random random = new Random();

  static String unescapeUrlParam(String s) {
    try {
      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c == '%') {
          String hex = s.substring(i + 1, i + 3);
          baos.write(Integer.parseInt(hex, 16));
          i += 2;
        } else if (c <= 127) {
          baos.write(c);
        } else {
          baos.write(s.substring(i, i + 1).getBytes("utf8"));
        }
      }
      return new String(baos.toByteArray(), "utf8");
    } catch (IOException e) {
      throw new RuntimeException(e);
    }
  }

  static String escapeUrlParam(String s) {
    StringBuilder sb = new StringBuilder(s.length());
    for (int i = 0; i < s.length(); i++) {
      char c = s.charAt(i);
      if (c <= ' ' || c == '&' || c == ':' || c == '=' || c == ';' || c == '#' || c == '%') {
        sb.append('%');
        sb.append(Character.forDigit(c / 16, 16));
        sb.append(Character.forDigit(c % 16, 16));
      } else {
        sb.append(c);
      }
    }
    return sb.toString();
  }


  public static byte[] readFully(InputStream is) throws IOException {
    byte[] buf = new byte[16384];
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    while (true) {
      int count = is.read(buf);
      if (count <= 0) {
        break;
      }
      baos.write(buf, 0, count);
    }
    return baos.toByteArray();
  }

  /**
   * Reading request properties instead will consume part of the content in POST requests,
   * as the servlet API tries to read form parametrs from the request body.
   */
  public static Map<String,String> getParams(String query) {
    Map<String,String> params = new TreeMap<>();
    if (query != null) {
      if (query.startsWith("?")) {
        query = query.substring(1);
      }
      for (String s: query.split("&")) {
        int cut = s.indexOf('=');
        if (cut != -1) {
          params.put(s.substring(0, cut), unescapeUrlParam(s.substring(cut + 1)));
        }
      }
    }
    return params;
  }

  public static Query createQuery(Map<String,String> params) {
    ArrayList<Query.Filter> filterList = new ArrayList<>();
    boolean sortByRev = true;
    for (Map.Entry<String,String> entry: params.entrySet()) {
      String name = entry.getKey();
      String value = entry.getValue();
      if (FIELD_REV.equals(name)) {
        int rev = Integer.parseInt(value);
        Query.Filter filter = new Query.FilterPredicate(FIELD_REV, Query.FilterOperator.EQUAL, rev);
        filterList.add(filter);
        sortByRev = false;
      } else if (FILTER_WHITELIST.contains(name)) {
        System.out.println("filter: " + name + "=" + value);
        Query.Filter filter = new Query.FilterPredicate(name, Query.FilterOperator.EQUAL, value);
        filterList.add(filter);
      }
    }
    Query query = new Query(KIND_CODE);
    if (sortByRev) {
      query.addSort(FIELD_REV, Query.SortDirection.DESCENDING);
    }
    if (filterList.size() == 1) {
      query.setFilter(filterList.get(0));
    } else if (filterList.size() > 1) {
      Query.Filter filter = new Query.CompositeFilter(Query.CompositeFilterOperator.AND, filterList);
      query.setFilter(filter);
    }
    return query;
  }

  /**
   * Writes the properties of the given entity to the first line of the request.
   */
  public void writeProperties(Entity entity, PrintWriter writer, boolean includeSecret) throws IOException {
    boolean first = true;
    for (Map.Entry<String, Object> entry : entity.getProperties().entrySet()) {
      String key = entry.getKey();
      if (RETURN_WHITELIST.contains(key) || (includeSecret && FIELD_SECRET.equals(key))) {
        if (first) {
          first = false;
        } else {
          writer.write(';');
        }
        writer.write(key);
        writer.write('=');
        writer.write(escapeUrlParam(String.valueOf(entry.getValue())));
      }
    }
    writer.println();
  }


  public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    System.out.println();
    System.out.println("Handling GET request: " + req.getQueryString());

    Map<String,String> params = getParams(req.getQueryString());
    String cmd = params.get(KEY_CMD);

    Query query = createQuery(params);
    Iterator<Entity> i = datastore.prepare(query).asIterator();

    resp.setContentType("text/plain");
    PrintWriter writer = resp.getWriter();

    System.out.println("cmd:" + cmd);

    if ("ls".equals(cmd)) {
      writer.println("cmd=ls");
      while(i.hasNext()) {
        Entity entity = i.next();
        writer.write("Type=file");
        Object modify = entity.getProperty(FIELD_TIMESTAMP);
        if (modify != null) {
          writer.write(";Modify=");
          writer.write(String.valueOf(modify));
        }
        writer.write(' ');
        writer.println(String.valueOf(entity.getProperty(FIELD_PATH)));
      }
    } else if (!i.hasNext()) {
      throw new IOException("Requested ID or revision not found");
    } else {
      Entity entity = i.next();
      writeProperties(entity, writer, false /* includeSecret */);
      Text content = (Text) entity.getProperty(FIELD_CONTENT);
      writer.println(content.getValue());
    }
  }

  public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    System.out.println();
    System.out.println("Handling POST request: " + req.getQueryString());

    Map<String, String> params = getParams(req.getQueryString());

    String id = params.get("id");
    String secret = params.get("secret");
    int rev = -1;
    String forked_from = null;

    Entity entity = null;
    if (id != null && secret != null) {
      Query query = createQuery(params);
      Iterator<Entity> i = datastore.prepare(query).asIterator();

      if (i.hasNext()) {
        entity = i.next();
        rev = ((Number) (entity.getProperty(FIELD_REV))).intValue() + 1;
      } else {
        // Confirm id / secret combination

        Query.Filter filter = new Query.FilterPredicate(FIELD_ID, Query.FilterOperator.EQUAL, id);
        query = new Query("Code").setFilter(filter).addSort(FIELD_REV, Query.SortDirection.DESCENDING);
        i = datastore.prepare(query).asIterator();
        if (i.hasNext()) {
          Entity template = i.next();
          if (secret.equals(template.getProperty(FIELD_SECRET))) {
            rev = ((Number) (template.getProperty(FIELD_REV))).intValue() + 1;
            forked_from = String.valueOf(template.getProperty(FIELD_FORKED_FROM));
          } else {
            entity = null;
          }
        }
      }
    }

    if (entity == null) {
      entity = new Entity(KIND_CODE);
      if (forked_from != null) {
        entity.setProperty(FIELD_FORKED_FROM, forked_from);
      }
      if (rev == -1) {
        id = Long.toString(random.nextLong() & 0x7fffffffffffffffL, 36);
        secret = Long.toString(random.nextInt() & 0x7fffffffffffffffL, 36);
        rev = 1;
      }
    }

    for (Map.Entry<String,String> entry: params.entrySet()) {
      String name = entry.getKey();
      if (WRITE_WHITELIST.contains(name)) {
        String value = entry.getValue();
        entity.setProperty(name, value);
        System.out.println("entity.setProperty '" + name + "' to '" + value + "'");
      } else {
        System.out.println("Skipping property '" + name + "'");
      }
    }

    byte[] data = readFully(req.getInputStream());
    Text content = new Text(new String(data, "utf8"));

    entity.setProperty(FIELD_ID, id);
    entity.setProperty(FIELD_REV, rev);
    entity.setProperty(FIELD_SECRET, secret);
    entity.setProperty(FIELD_CONTENT, content);

    datastore.put(entity);
    resp.setContentType("text/plain");
    writeProperties(entity, resp.getWriter(), true /* includeSecret */);
  }
}
