var base = require( '../ProducerBase.js' );

function TwitterUserProfileProducer( fetcher ) {
	this.fetcher = fetcher;
	base.init( this );
}
base.inherit( TwitterUserProfileProducer );

TwitterUserProfileProducer.prototype.init = function( done ) {
	var self = this;
	this.fetcher.tokenStore.getApplicationTokens( 'twitter', function( error, tokens ) {
		if( error ) {
			done( error );
		}
		else
		{
			var OAuth = require( 'oauth' ).OAuth;
			self.oauth = new OAuth( 
				"https://api.twitter.com/oauth/request_token",
				"https://api.twitter.com/oauth/authorize",
				tokens.consumerKey, 
				tokens.consumerSecret,
				"1.0", null, "HMAC-SHA1" );
			done();
		}
	} );
}
TwitterUserProfileProducer.prototype.getMatchPatterns = function() {
	return [ '^acct:twitter:[0-9]+', '/user/[0-9]+' ];
}
TwitterUserProfileProducer.prototype.attemptRequest = function( uri, owner, source, resource, keys, callback ) {
	var self = this;
	var userId = resource.match( /^\/user\/([0-9]+)/ )[1];

	var twitterUrl = 'https://api.twitter.com/1.1/users/show.json?user_id=' + userId;
	self.oauth.get( twitterUrl, keys.token, keys.tokenSecret, 
		function( error, result ) {
			if( error )
				callback( error, null );
			else
			{
				callback( null, {
					'uri': uri,
					'data': result
				});
			}
		} 
	);
};
module.exports = exports = TwitterUserProfileProducer;
