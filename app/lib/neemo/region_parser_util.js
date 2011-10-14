
var sys   = require('sys')
    , fs  = require("fs");
    
exports.start = function(callback){
        eval(fs.readFileSync('./config/struct.js', encoding="ascii"));
        doc = {};
        var track = 1;
        var protected_request = this.api_url;
        var dirr, mis, query, region, filee, tra;
        for (i in existingtracks){
            dirr = existingtracks[i].directory,
            mis = '20110503_Neemo2';
            query = "";
            region = 1;
            regions = []
            for (k in existingtracks[i].files) {
                filee = existingtracks[i].files[k];
                url = dirr+'/'+filee;
                regions.push(url);
                region++;
            }
            doc[track] = regions;
            console.log(track);
            console.log(region);
            track++;
        }
        
        fs.writeFile("./public/regions/tracks.js", "var tracks = " + JSON.stringify(doc), function(err) {
            if(err) {
                sys.puts(err);
            } else {
                sys.puts("The file was saved!");
            }
        }); 
}