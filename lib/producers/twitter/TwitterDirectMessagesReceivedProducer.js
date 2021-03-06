var Moment = require( 'moment' );
var BigNumber = require( './bignumber.js' );

var base = require( '../ProducerBase.js' );
function TwitterDirectMessagesReceivedProducer( fetcher ) {
	this.fetcher = fetcher;
	base.init( this );
}
base.inherit( TwitterDirectMessagesReceivedProducer );

TwitterDirectMessagesReceivedProducer.prototype.init = function( done ) {
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
TwitterDirectMessagesReceivedProducer.prototype.getMatchPatterns = function() {
	return [ '^acct:twitter:[0-9]+', '/direct/received' ];
}
TwitterDirectMessagesReceivedProducer.prototype.attemptRequest = function( uri, owner, source, resource, keys, callback ) {
	var self = this;

	var userId = source.match( /^acct:twitter:([0-9]+)/ )[1];

	var sinceMatch = resource.match( '[?&]since=([0-9]+)' );
	var since = null;
	if( sinceMatch != null )
		since = parseInt( sinceMatch[1] );

	var tweetSets = new Array();
	var requestPriorTweets = function( err, data, minimumReceived ) {
		if( err == null )
		{
			if( data != null )
			{
				if( since == null ){
					data.forEach( function ( item ) {
						tweetSets.push( item );
					});
					self.getSomeTweetsPriorTo( minimumReceived.subtract( 1 ), userId, keys, requestPriorTweets );
				}
				else
				{
					var earliest = Moment().valueOf();

					data.forEach( function ( item ) {
						var itemDate = Moment( item.created_at ).valueOf();
						if( itemDate < earliest )
							earliest = itemDate;
						if( since <= itemDate )
							tweetSets.push( item );
					} );

					if( since <= earliest )
					{
						self.getSomeTweetsPriorTo( minimumReceived.subtract( 1 ), userId, keys, requestPriorTweets );
					}
					else
					{
						callback( null, {
							uri: uri,
							data: tweetSets
						} );	
					}
				}
			}
			else
			{
				callback( null, {
					uri: uri,
					data: tweetSets
				} );	
			}
		}
		else
		{
			callback( err, null );
		}
	};
	self.getSomeTweetsPriorTo( null, userId, keys, requestPriorTweets );
};
TwitterDirectMessagesReceivedProducer.prototype.getSomeTweetsPriorTo = function( maxId, userId, keys, callback ) {
	var url;
	if( maxId != null )
		url = 'https://api.twitter.com/1.1/direct_messages.json?skip_status=t&count=200&user_id=' + userId + '&max_id=' + maxId;
	else
		url = 'https://api.twitter.com/1.1/direct_messages.json?skip_status=t&count=200&user_id=' + userId;
	this.getUrlUsingOauth( url, keys, function( err, data ){
		try {
			if( err == null )
			{
				var parsedData = JSON.parse( data );
				var minimumReceived = maxId;
				if( parsedData.length == 0 )
					callback( null, null, null );
				else
				{
					for( var i=0; i<parsedData.length; i++ )
					{
						var id = new BigNumber( parsedData[i].id_str );
						if( minimumReceived == null || 
							id.compare( minimumReceived ) < 0 )
							minimumReceived = id;
					}
					callback( null, parsedData, minimumReceived );
				}
			}
			else
			{
				callback( err, null, null );
			}
		} catch( err ) {
			callback( err, null, null );
		}
	} );
};
TwitterDirectMessagesReceivedProducer.prototype.getUrlUsingOauth = function( url, keys, callback ) {
	var self = this;
	var retryCount = 0;
	var retryRequest = function( err, data, res ) {
		if( err )
		{
			if( retryCount < 10 )
			{
				retryCount++;
				self.oauth.get( url, keys.token, keys.tokenSecret, retryRequest );
			}
			else
				callback( err, null );
		}
		else
			callback( null, data );
	}
	self.oauth.get( url, keys.token, keys.tokenSecret,retryRequest );
}
module.exports = exports = TwitterDirectMessagesReceivedProducer;
