        var dataCenterLabel = this.getParameter('sysparm_dataCenterLabel'); // Get parameter from GlideAjax
        
        if (!dataCenterLabel) {
            return JSON.stringify([]); // Return an empty JSON array
        }

        var networks = [];
        var dataCenterSysId = '';

        // Step 1: Get Sys ID of Data Center
        var grDC = new GlideRecord('cmdb_ci_aws_datacenter');
        grDC.addQuery('u_label', dataCenterLabel);
        grDC.query();
        if (grDC.next()) {
            dataCenterSysId = grDC.getValue('sys_id');
        }

        if (!dataCenterSysId) {
            return JSON.stringify([]); // Return empty array if not found
        }

        // Step 2: Find Cloud Networks (VPCs) related to Data Center
        var grRel = new GlideRecord('cmdb_rel_ci');
        grRel.addQuery('child', dataCenterSysId);
        grRel.query();

        while (grRel.next()) {
            var parentSysId = grRel.getValue('parent');

            // Step 3: Check if the parent is a Cloud Network (VPC) and is "Available"
            var grNetwork = new GlideRecord('cmdb_ci_network');
            grNetwork.addQuery('sys_id', parentSysId);
            grNetwork.addQuery('state', 'Available');
            grNetwork.query();

            while (grNetwork.next()) {
                var networkData = {
                    sys_id: grNetwork.getValue('sys_id'),
                    name: grNetwork.getValue('name')
                };
                networks.push(networkData);
            }
        }
        return JSON.stringify(networks);