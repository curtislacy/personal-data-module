function GMailUserProfileTranslator() {	
}
GMailUserProfileTranslator.prototype.getMatchPatterns = function() {
	return [ '^acct:gmail:[0-9]+', '/user/[0-9]+' ];
}
GMailUserProfileTranslator.prototype.translate = function( uri, owner, rawDoc, callback ) {
	try {
		var userProfile = JSON.parse( rawDoc.data );

		// Translated to fields more or less compliant with the OpenSocial 2.5.0 draft 
		// spec (opensocial-social-data-specification-2-5-0-draft):
		// http://opensocial-resources.googlecode.com/svn/spec/trunk/Social-Data.xml
		var result = {
			// Required fields by spec
			'id': uri,
			'displayName': {'formatted': userProfile.name },

			// Additional required fields for UI
			'preferredUsername': userProfile.email,
			'thumbnailUrl': userProfile.picture,
			'appData': { 
				'serviceName': 'GMail',
				'serviceImgUrl': '/images/512x512-logos/gmail.png'
			},
			'urls': [ userProfile.link ],
			'emails': [ userProfile.email ],
			'birthday': userProfile.birthday,
			'gender': userProfile.gender,
			'languagesSpoken': [ userProfile.locale ]
		};
		if( !result.thumbnailUrl )
			result.thumbnailUrl = '/images/generic_user_image.jpeg';

		var outputData = {
			'uri': uri,
			'owner': owner,
			'category': 'person',
			'data': result
		};

    	process.nextTick( function() {
    		callback( error, outputData.data );
    	});
	} catch( err ) {
        callback(  err , null );
	}
}
module.exports = exports = GMailUserProfileTranslator;
