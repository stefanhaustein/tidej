package net.tidej.storage;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.Iterator;
import java.util.Random;

import javax.servlet.http.*;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Text;
import com.google.appengine.labs.repackaged.com.google.common.collect.Lists;

@SuppressWarnings("serial")
public class StorageServlet extends HttpServlet {
	static final String KIND_CODE = "Code";
	static final String FIELD_ID = "id";
	static final String FIELD_REV = "rev";
	
	DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
	Random random = new Random();
	
	public void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
		String id = req.getParameter("id");
		String revRaw = req.getParameter("rev");
		
		Query query = new Query("Code");
		Query.Filter filter = new Query.FilterPredicate(FIELD_ID, Query.FilterOperator.EQUAL, id);
		if (revRaw != null && !revRaw.trim().equals("")) {
			int rev = Integer.parseInt(revRaw);
			Query.Filter revFilter = new Query.FilterPredicate(FIELD_REV, Query.FilterOperator.EQUAL, rev);
			filter = new Query.CompositeFilter(Query.CompositeFilterOperator.AND, Lists.newArrayList(filter, revFilter));
		} else {
			query.addSort(FIELD_REV, Query.SortDirection.DESCENDING);
		}
		query.setFilter(filter);
		Iterator<Entity> i = datastore.prepare(query).asIterator();
		if (!i.hasNext()) {
			throw new IOException("Requested ID or revision not found");
		} 
		
		resp.setContentType("text/plain");
		Text content = (Text) i.next().getProperty("content");
		resp.getWriter().println(content.getValue());
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
		Entity entity = new Entity(KIND_CODE);
		String id = req.getParameter("id");
		int rev;
		if (id == null) {
			id =  Long.toString(random.nextLong() & 0x7fffffffffffffffL, 36);
			rev = 1;
		} else {
			Query.Filter filter = new Query.FilterPredicate(FIELD_ID, Query.FilterOperator.EQUAL, id);
			Query query = new Query("Code").setFilter(filter).addSort(FIELD_REV, Query.SortDirection.DESCENDING);
			Iterator<Entity> i = datastore.prepare(query).asIterator();
			if (!i.hasNext()) {
				throw new IOException("Requested ID not found");
			} 
			rev = ((Number) (i.next().getProperty(FIELD_REV))).intValue() + 1;
		}
		entity.setProperty("id", id);
		entity.setProperty("rev", rev);
		entity.setProperty("content", content);
		datastore.put(entity);
		resp.setContentType("text/plain");
		resp.getWriter().println("{id: '" + id + "', rev: " + rev + "}");
	}
}
