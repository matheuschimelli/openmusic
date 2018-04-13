  if (window.location.protocol != 'https:') {
    window.location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
  }


  $(document).ready(function() {

    $("#searchResults").css("display", "none");
    $("#inputSearch").keypress(function(e) {
      if (e.which == 13) {
        $("#goInput").click();
      }
    })
    $("#goInput").on('click', function(e) {
      var string = $("#inputSearch").val();
      console.log(string);

      var map = {
        "â": "a",
        "Â": "A",
        "à": "a",
        "À": "A",
        "á": "a",
        "Á": "A",
        "ã": "a",
        "Ã": "A",
        "ê": "e",
        "Ê": "E",
        "è": "e",
        "È": "E",
        "é": "e",
        "É": "E",
        "î": "i",
        "Î": "I",
        "ì": "i",
        "Ì": "I",
        "í": "i",
        "Í": "I",
        "õ": "o",
        "Õ": "O",
        "ô": "o",
        "Ô": "O",
        "ò": "o",
        "Ò": "O",
        "ó": "o",
        "Ó": "O",
        "ü": "u",
        "Ü": "U",
        "û": "u",
        "Û": "U",
        "ú": "u",
        "Ú": "U",
        "ù": "u",
        "Ù": "U",
        "ç": "c",
        "Ç": "C"
      };

      function removerAcentos(s) {
        return s.replace(/[\W\[\] ]/g, function(a) {
          return map[a] || a
        })
      };

      $.getJSON("api/" + removerAcentos(string), function(data) {
        $("#searchResults").slideUp(200);
        $("#searchResults").slideDown(200);
        $("#music-name").text(data.results[0].trackCensoredName);
        $("#musicID").val(data.results[0].trackId);
        var trackName2 = data.results[0].trackCensoredName;
        var artistName2 = data.results[0].artistName;
        console.log(trackName2);
        console.log(artistName2);
        $("meta[property='og\\:title']").attr("content", trackName2 + " no OpenMusic");


        var imageURL = data.results[0].artworkUrl100;
        var img = imageURL.replace("100x100bb.jpg", "200x200bb.jpg");
        var urlFinal = encodeURIComponent(img);

        $("#image").attr("src", "img/" + encodeURIComponent(img));

        $("#header").attr("<h1>Olamundo/h1>");
        $("meta[property='og\\:description']").attr("content", "Mais músicas de " + artistName2 + " no OpenMusic");

        $("#collection-name").text("Álbum: " + data.results[0].collectionName);
        $("#artist-name").text(data.results[0].artistName);
        $("#composer").text(data.results[0].artistName);
        $("#genre").text(data.results[0].primaryGenreName);
        $("#year").text(data.results[0].releaseDate);
      })



    }).keyup()
    $("#linkDireto").on('click', function(e) {
      waitingDialog.show('Baixando musica...');
      setTimeout(function() {
        waitingDialog.hide();
      }, 20000);
    });
    
    if ('serviceWorker' in navigator) {
      console.log('CLIENT: service worker registration in progress.');
      navigator.serviceWorker.register('service-worker.js').then(function() {
        console.log('CLIENT: service worker registration complete.');
      }, function() {
        console.log('CLIENT: service worker registration failure.');
      });
    }
    else {
      console.log('CLIENT: service worker is not supported.');
    }
  })
  