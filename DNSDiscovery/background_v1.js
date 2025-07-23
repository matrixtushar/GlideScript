var gr = new GlideRecord('cmdb_ci_dns_name');
gr.addQuery('u_external', 'true');
gr.query();
while(gr.next())
{
	//gs.info(gr.name);
	//get this sub-domains for this
	var domain = gr.name;
	var url = "https://crt.sh/?q=%25." + domain + "&output=json";
	var r = new sn_ws.RESTMessageV2();
	r.setHttpMethod("GET");
	r.setEndpoint(url);
	r.setHttpTimeout(60000);
	r.setRequestHeader("User-Agent", "ServiceNow Script"); // helps avoid being blocked by crt.sh
	try {
			var response = r.execute();
			var body = response.getBody();
			if (!body || body.trim().length === 0) {
				gs.error("Empty JSON string received. Possibly a network issue or blocked request.");
			}
			if (body.trim().startsWith("<")) {
				gs.error("crt.sh returned HTML instead of JSON. Possibly rate-limited or blocked.");
			}
			var records = JSON.parse(body);
			var seen = {};
			var filtered = [];
			for (var i = 0; i < records.length; i++) {
				var names = records[i].name_value.split("\n");
				for (var j = 0; j < names.length; j++) {
					var sub = names[j].trim().toLowerCase();
					if (sub.startsWith("*.") || sub.startsWith("www.")) continue;
					if (!seen[sub]) {
						seen[sub] = true;
						filtered.push(sub);
					}
				}
			}
			//gs.print("Subdomains found:");
			for (var k = 0; k < filtered.length; k++) {
				if(filtered[k] != gr.name)
				{
					gs.print("- " + filtered[k]);
					var grSub = new GlideRecord('u_cmdb_ci_dns_name_subdomain');
					grSub.addQuery('name', filtered[k]);
					if(!gr.next())
					{
						grSub.initialize();
						grSub.name = filtered[k];
						grSub.u_external = true;
						grSub.insert();
					}
				}
			}
			//Iske DNS records to layiye... itna to kariye... ye kya hai!! 
			var dns = new DNSUtils();
			var result = dns.getDNSRecords(gr.name);
			for (var m = 0; m < result.length; m++) {
				var recordType = result[m].type;
				var dnsDataArr = result[m].data;
				for (var n = 0; n < dnsDataArr.length; n++) {
					var value = dnsDataArr[n];
					var row = '| ' + recordType.padEnd(11) + ' | ' + value.padEnd(35) + ' |';
					gs.info(row);
					// update in the DNS Records table
					var grDNSRec = new GlideRecord('u_cmdb_ci_dns_name_records');
					grDNSRec.addQuery('name', value.padEnd(35));
					grDNSRec.query();
					if(!grDNSRec.next())
					{
						grDNSRec.initialize();
						grDNSRec.name = value.padEnd(35);
						grDNSRec.u_record_type = recordType.padEnd(11);
						grDNSRec.u_record_value = value.padEnd(35);
						grDNSRec.u_parent_domain = gr.getValue('sys_id');
						grDNSRec.insert();
					}
					gs.sleep(2000);
				}
			}
		}
	catch (ex){
		gs.error("Error fetching from crt.sh: " + ex.message);
	}
}