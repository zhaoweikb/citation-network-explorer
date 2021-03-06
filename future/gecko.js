newModule("gecko", {
  eventResponses: {
    newSeed: {
      listening: false,
      action: function(paper) {
        let url = "/api/v1/getMockResponse?doi=" + paper.doi;
        fetch(url)
          .then(resp => resp.json())
          .then(json => {
            gecko.parseResponse(json.data, paper);
          });
      }
    }
  },
  methods: {
    parseResponse: function(data, paper) {
      for (let i = 0; i < data.papers.length; i++) {
        paper = {
          doi: response.doi,
          title: response.title[0],
          author: response.author[0].family,
          month: response.created["date-parts"][0][1],
          year: response.created["date-parts"][0][0],
          timestamp: response.created.timestamp,
          journal: response["container-title"][0],
          citationCount: response["is-referenced-by-count"],
          references: response["reference"] ? response["reference"] : false
        };

        addPaper(data.papers[i]);
      }

      for (let i = 0; i < data.edges.length; i++) {
        let edge = data.edges[i];
        edge.source = Papers.filter(p => p.geckoID == edge.source);
        edge.target = Papers.filter(p => p.geckoID == edge.target);
        addEdge(edge);
      }

      console.log("Gecko found " + data.edges.length + " citations");
      return cited;
    }
  }
});
