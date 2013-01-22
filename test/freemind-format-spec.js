describe('freemind-format', function () {
	'use strict';
	it('converts a single node map into a MAP/NODE XML element in freemind format', function () {
    var idea=content({id:1, title:'Root Node'});
    expect(MAPJS.freemindFormat(idea)).toBe('<map version="0.7.1"><node ID="1" TEXT="Root Node"></node></map>');
	});
	it('converts double quotes, > and < to XML entity in node titles', function(){
    var idea=content({id:1, title:'Text"<>"<>More'});
    expect(MAPJS.freemindFormat(idea)).toBe('<map version="0.7.1"><node ID="1" TEXT="Text&quot;&lt;&gt;&quot;&lt;&gt;More"></node></map>');
	});
	it('embeds subideas into child nodes, using negative ranks for left and positive for right', function(){
    var idea=content({id:1, title:'A', ideas:{'-1':{id:2, title:'B'},'2':{id:3, title:'C'}}});
    expect(MAPJS.freemindFormat(idea)).toBe('<map version="0.7.1"><node ID="1" TEXT="A">'+
    '<node ID="2" TEXT="B"></node>'+
    '<node ID="3" TEXT="C"></node>'+
    '</node></map>');
	});
;});
