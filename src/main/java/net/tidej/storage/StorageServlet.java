package net.tidej.storage;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.Random;

import javax.servlet.http.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Text;

@SuppressWarnings("serial")
public class StorageServlet extends HttpServlet {
	static final String KIND_CODE = "Code";
	
	static final String FIELD_ID = "id";
	static final String FIELD_CONTENT = "content";
	static final String FIELD_REV = "rev";
	static final String FIELD_PREV_REV = "prev_rev";
	static final String FIELD_FORKED_FROM = "forked_from";
	static final String FIELD_SECRET = "secret";
	static final String FIELD_TAG = "tag";
	
	DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
	Random random = new Random();
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		String id = req.getParameter("id");
		String revRaw = req.getParameter("rev");
		String tag = req.getParameter("tag");
		
		Query query = new Query("Code");
		Query.Filter filter = new Query.FilterPredicate(FIELD_ID, Query.FilterOperator.EQUAL, id);
		if (revRaw != null && !revRaw.trim().equals("")) {
			int rev = Integer.parseInt(revRaw);
			Query.Filter revFilter = new Query.FilterPredicate(FIELD_REV, Query.FilterOperator.EQUAL, rev);
		  	ArrayList<Query.Filter> filterList = new ArrayList<>();
		  	filterList.add(filter);
		  	filterList.add(revFilter);
			filter = new Query.CompositeFilter(Query.CompositeFilterOperator.AND, filterList);
		} else if (tag != null && !tag.trim().equals("")) {
			Query.Filter tagFilter = new Query.FilterPredicate(FIELD_TAG, Query.FilterOperator.EQUAL, tag);
			ArrayList<Query.Filter> filterList = new ArrayList<>();
			filterList.add(filter);
			filterList.add(tagFilter);
			filter = new Query.CompositeFilter(Query.CompositeFilterOperator.AND, filterList);
		} else {
			query.addSort(FIELD_REV, Query.SortDirection.DESCENDING);
		}
		query.setFilter(filter);
		Iterator<Entity> i = datastore.prepare(query).asIterator();
		if (!i.hasNext()) {
			throw new IOException("Requested ID or revision not found");
		} 
		
		resp.setContentType("text/plain");
		Entity entity = i.next();
		Text content = (Text) entity.getProperty("content");
		PrintWriter writer = resp.getWriter();
		writer.print("rev=" + entity.getProperty("rev") + ";");
		writer.print("tag=" + entity.getProperty("tag") + "\n");
		writer.println(content.getValue());
	}
	
	public void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		BufferedReader reader = req.getReader();
		StringBuilder sb = new StringBuilder();
		boolean first = true;
		while(true) {
			String line = reader.readLine();
			if (line == null) {
				break;
			}
			if (first) {
				first = false;
			} else {
				sb.append('\n');
			}
			sb.append(line);
		}
		Text content = new Text(sb.toString());
		String id = req.getParameter("id");
		String prev_rev = req.getParameter("rev");
		String secret = req.getParameter("secret");
		String tag = req.getParameter("tag");
		String forked_from = id;
		int rev = -1;

		System.err.println("id: " + id + " secret:" + secret);
		Entity existing = null;
		
		if (id != null && secret != null) {
			Query.Filter filter = new Query.FilterPredicate(FIELD_ID, Query.FilterOperator.EQUAL, id);
			if (tag != null && !tag.trim().equals("")) {
				Query.Filter tagFilter = new Query.FilterPredicate(FIELD_TAG, Query.FilterOperator.EQUAL, tag);
				ArrayList<Query.Filter> filterList = new ArrayList<>();
				filterList.add(filter);
				filterList.add(tagFilter);
				filter = new Query.CompositeFilter(Query.CompositeFilterOperator.AND, filterList);
			}
			Query query = new Query("Code").setFilter(filter).addSort(FIELD_REV, Query.SortDirection.DESCENDING);
			Iterator<Entity> i = datastore.prepare(query).asIterator();
			if (i.hasNext()) {
				existing = i.next();
				if (secret.equals(existing.getProperty(FIELD_SECRET))) {
					rev = ((Number) (existing.getProperty(FIELD_REV))).intValue() + 1;
					forked_from = (String) existing.getProperty(FIELD_FORKED_FROM);
				}
			} 
		} 
		if (rev == -1) {
			id = Long.toString(random.nextLong() & 0x7fffffffffffffffL, 36);
			secret = Long.toString(random.nextInt() & 0x7fffffffffffffffL, 36);
			rev = 1;
		}
		Entity entity = (existing != null && tag != null && !tag.isEmpty()) ? existing : new Entity(KIND_CODE);
		entity.setProperty(FIELD_ID, id);
		entity.setProperty(FIELD_REV, rev);
		entity.setProperty(FIELD_SECRET, secret);
		entity.setProperty(FIELD_FORKED_FROM, forked_from);
		entity.setProperty(FIELD_PREV_REV, prev_rev);
		entity.setProperty(FIELD_CONTENT, content);
		entity.setProperty(FIELD_TAG, tag);
		datastore.put(entity);
		resp.setContentType("text/plain");
		resp.getWriter().println("id=" + id + ";secret=" + secret + ";rev=" + rev + ";tag=" + tag);
	}
}
