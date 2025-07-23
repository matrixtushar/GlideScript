var daysBack = 45;
var cutoff = new GlideDateTime();
cutoff.subtract(new GlideDuration(daysBack + " 00:00:00"));
var inactiveCount = 0;
var grRole = new GlideRecord('sys_user_has_role');
grRole.addQuery('role', '282bf1fac6112285017366cb5f867469');
grRole.query();
while(grRole.next())
{
	var userGR = grRole.user.getRefRecord();
	if (userGR.isValidRecord() && userGR.active == true) {
		var lastLogin = userGR.getValue('last_login');
		// If last_login is empty OR earlier than cutoff
		if (gs.nil(lastLogin) || new GlideDateTime(lastLogin).compareTo(cutoff) < 0) {
			gs.info('User: ' + userGR.getDisplayValue() +
			' | Active: ' + userGR.getValue('active') +
			' | Email: ' + userGR.getValue('email') +
			' | Last Login: ' + (lastLogin ? lastLogin : 'Never'));
			inactiveCount++;
		}
	}	
}
gs.info(inactiveCount);