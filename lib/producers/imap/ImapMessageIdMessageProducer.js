var base = require( '../ProducerBase.js' );

function ImapMessageProducer() {
    base.init( this );
}
base.inherit( ImapMessageProducer );

ImapMessageProducer.prototype.getMatchPatterns = function() {
	return [ '^acct:((imap)|(gmail)):.+', '/message/[^/]*/message-id/[^/]*$' ];
}
ImapMessageProducer.prototype.attemptRequest = function( uri, owner, source, resource, keys, callback ) {
	var self = this;
	var parsedResource = resource.match( /\/message\/([^\/]*)\/message-id\/([^\/]*)$/ );
    var mailbox = parsedResource[1];
	var messageId = parsedResource[2];

	ImapService.searchForMessages( owner, keys, mailbox, [ [ 'HEADER', 'Message-ID', messageId ] ], 
        function( error, data ){
            if( error )
                callback( error, null );
            else
            {
                callback( null, {
                    'uri': uri, 
                    'data': data[0]
                });
            }
        } );
};

module.exports = exports = ImapMessageProducer;
