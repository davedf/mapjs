var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport 
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();


function split_left_right(json){
    //preprocess subtrees orientation
    var arr = json.children, len = arr.length;
    for(var i=0; i < len; i++) {
    	//split half left orientation
      if(i < len / 2) {
    		arr[i].data.$orn = 'left';
    		$jit.json.each(arr[i], function(n) {
    			n.data.$orn = 'left';
    		});
    	} else {
    	//half right
    		arr[i].data.$orn = 'right';
    		$jit.json.each(arr[i], function(n) {
    			n.data.$orn = 'right';
    		});
    	}
    }
    //end
}
function init_tree(json,container_id){
    //init data
    split_left_right(json);
    //init Spacetree
    //Create a new ST instance
    var st = new $jit.ST({
       // Navigation: {  
       //     enable: true,  
       //     panning: 'avoid nodes',  
       //     zooming: 20  
       // }, 
        //id of viz container element
        injectInto: container_id,
        //multitree
    	  multitree: true,
        //set duration for the animation
        duration: 800,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 40,
        //sibling and subtrees offsets
        siblingOffset: 3,
        subtreeOffset: 3,
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            type: 'ellipse',
            color: '#aaa',
            overridable: true,
            autoHeight: true,
            autoWidth: false,
            //set canvas specific styles
            //like shadows
            CanvasStyles: {
              shadowColor: '#ccc',
              shadowBlur: 10
            }
        },
        Edge: {
            type: 'bezier',
            overridable: true
        },
        
        onBeforeCompute: function(node){ },
        
        onAfterCompute: function(){ },
        
        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;            
            label.innerHTML = node.name;
            label.onclick = function(){
              st.onClick(node.id);
            };
            //set label styles
            var style = label.style;
            style.width=node.data.$width+'px';
            // ugly ugly ugly
            style.height = (node.data.$height/2) + 'px';
            style.paddingTop=(node.data.$height/4)+ 'px';

        },
        
        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node){
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#ff7";
            }
            else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                if(!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function(n) { count++; });
                    //assign a node color based on
                    //how many children it has
                    node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];                    
                }
            }
        },
        
        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eed";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    //load json data
    st.loadJSON(json);
    //compute node positions and layout
    st.compute('end');
    st.select(st.root);
    //end
}
