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


function init_tree(json,container_id){
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
    	  //multitree: true,
        //set duration for the animation
        duration: 800,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 40,
        //sibling and subtrees offsets
        siblingOffset: 3,
        subtreeOffset: 3,
        levelsToShow: 5,
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
            var content_span=document.createElement("span");
            content_span.className='nodecontent';
            label.appendChild(content_span);
            label.id = node.id;            
            content_span.onclick = function(){ st.onClick(node.id); };
            content_span.ondblclick= function(){ st.edit_node(node); };

            var button_span=document.createElement("span");
            button_span.className='nodebuttons';
            label.appendChild(button_span);
            var btn_add=document.createElement('a');
            btn_add.className='button';
            btn_add.onclick= function(){ st.add_child_node(node);}; 
            btn_add.innerText='+';
            button_span.appendChild(btn_add);
        },
        onPlaceLabel: function(label,node){
            var content_span=label.getElementsByClassName('nodecontent')[0];
            var button_span=label.getElementsByClassName('nodebuttons')[0];
            content_span.innerHTML=node.name;
            var style = label.style;
            var content_style=content_span.style;
            var button_style=button_span.style;
            button_style.width=content_style.width=style.width=node.data.$width+'px';
            style.height=node.data.$height + 'px';
            content_style.height=(node.data.$height-button_span.offsetHeight)+'px';
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
    st.edit_node=function(node){
          var result=window.prompt('Edit label?',node.name);
          node.name=result;
          st.refresh();
          //this will also reposition labels properly
          st.onClick(node.id);
    };
    next_id=function(){
        window.node_uuid=window.node_uuid||0;
        window.node_uuid++;
        return "node_n"+window.node_uuid;
    }
    st.add_child_node=function(node){
      st.addSubtree({id:node.id,children: [{ id: next_id(), name: "Click to edit", data: {}, children: []}]},'animate',{hideLabels:false});

    }
    //load json data
    st.loadJSON(json);
    //compute node positions and layout
    st.compute('end');
    st.select(st.root);
    //end
    window.st=st;
}
