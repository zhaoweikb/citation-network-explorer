var Papers = []  //Array of paper objects with bibliographic information for each paper 
var Edges = [] //Array of edge objects, each is a pair of paper objects (source and target).

//Collection of metric functions to compute for each paper
var metrics = {  
    "citedBy": function(paper,Edges){
        //Count number of times cited in the edges list supplied
        return Edges.filter(e=>e.target==paper).length
    },
    "references": function(paper,Edges){
        //Count number of times a paper cites another paper (in the edge list provided) 
        return Edges.filter(e=>e.source==paper).length
    },
    "seedsCitedBy": function(paper,Edges){
        //Count number of seed papers that cite the paper.
        return Edges.filter(e=>e.source.seed&e.target==paper).length;
    },
    "seedsCited": function(paper,Edges){
        //Count number of seed papers the paper cites. 
        return Edges.filter(e=>e.target.seed&e.source==paper).length;
    }
};        

//Events are triggered when something interesting happens.

var events = {}; //Object of events comprising an array of methods to run when the event is triggered.

//Function for defining new events.
defineEvent = function(name){
    events[name] = {};
    events[name].methods = [];
}
//Function for triggering a named event and passing the subject of the event.
triggerEvent = function(name,subject){
    for(let i=0;i<events[name].methods.length;i++){
        events[name].methods[i].call(null,subject)
     }
}

defineEvent('newSeed'); //Event triggered when a new seed is added.
defineEvent('seedUpdate'); //Event triggered when more info is found on a seed i.e. title or DOI.
defineEvent('newPaper'); //Event triggered when a new (non-seed) paper is added.
defineEvent('paperUpdate') //Event trigger when non-seed paper is updated with more info. 


//Builds a new data source module.
newDataModule = function(name,methods){
    window[name] = methods; //add methods of module to there own namespace.
    for(event in events){
        if(methods.eventResponses[event]){ 
            events[event].methods.push(methods.eventResponses[event]); //if module has event response methods add them to the appropriate array.
        }
    } 
}

function makeSeed(paper){
    paper.seed = true;
    triggerEvent('newSeed',paper)
}

function addPaper(paper,asSeed){

    let match = matchPapers(paper,Papers)
    
    if(!match){
        paper.ID = Papers.length;
        Papers.push(paper)
        triggerEvent('newPaper',paper)
    } else {
        paper = merge(match,paper)
        //triggerEvent('paperUpdated',paper) // Ideally only triggers if there is new info.
    }

    if(asSeed&!paper.seed){makeSeed(paper)}

    return(paper)
}

addEdge = function(newEdge){
    let edge = Edges.filter(function(e){
        return e.source == newEdge.source & e.target == newEdge.target;
    })
    if(edge.length==0){
        Edges.push(newEdge);
    } else {
        merge(edge[0],newEdge)
    };
}

//For a new paper this function tries to find a match in the existing database
function matchPapers(paper,Papers){
    var match;
    if(paper.MicrosoftID){  
        match = Papers.filter(function(p){
            return p.ID==paper.ID
        })[0];
    };
    if(!match && paper.DOI){
        match = Papers.filter(function(p){   
            return (paper.DOI.toLowerCase() == (p.DOI ? p.DOI.toLowerCase() : null));      
        })[0];
    };
    if(!match && paper.Title && paper.Author){
        match = Papers.filter(function(p){
            if(p.Title){
                return (p.Title.toLowerCase()==paper.Title.toLowerCase()) && (paper.Author.toLowerCase()==(p.Author ? p.Author.toLowerCase() : null))
            } 
        })[0]; 
    };  
    return(match);  
};

//Given two paper/edge objects that are deemed to be matching, this merges the info in the two.
function merge(oldrecord,newrecord){
    for(i in newrecord){
        if(oldrecord[i]==undefined || oldrecord[i]==null ){
            oldrecord[i]=newrecord[i];
        }
    }
    if(newrecord.seed){
        oldrecord.seed = true;
    };//If either record is marked as a seed make the merged result a seed.
    return(oldrecord)
};

//Recalculates all metrics
function updateMetrics(Papers,Edges){                   
    for(metric in metrics){
        Papers.forEach(function(p){p[metric] = metrics[metric](p,Edges)});
    }
}
refreshGraphics = function(){
    updateMetrics(Papers,Edges); // update citation metrics
    updateSeedList(); //update HTML table
    updateConnectedList(forceGraph.sizeMetric);
    forceGraph.update(Papers,Edges);
    //timeGraph.update();
};

//Removes seed status of a paper, deletes all edges to non-seeds and all now unconnected papers
deleteSeed = function(paper){
    //Set seed status to false
    paper.seed = false; 
    //Delete edges connecting the paper to non-seeds
    Edges = Edges.filter(function(e){
        return !(((e.source == paper)&&(e.target.seed==false))||((e.target==paper)&&(e.source.seed==false)))
    })
    //Remove all non-seed Papers no longer connected to anything
    Papers = Papers.filter(function(p){
        return (Edges.map(function(e){return e.source}).includes(p) || Edges.map(function(e){return e.target}).includes(p));         
    })
    refreshGraphics();
};
