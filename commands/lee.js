const Discord = require('discord.js');
const fetch = require('node-fetch');

const keys = require('../private/keys.json');
const commands = require('../static').commands.lee;

module.exports.contains = function(cmd) {
    return Object.keys(commands).includes(cmd) || Object.values(commands).flat(1).includes(cmd);
}

module.exports.run = function(cmd, args, msg) {
    if(cmdIs(cmd, 'articles')) {
        sendArticles(msg, args);
    }
}

function cmdIs(given, toCheck) {
    return given === toCheck || commands[toCheck].includes(given);
}

// ________________________________________ FUNCTIONS ________________________________________

async function sendArticles(msg, args){
    let stock = args[0];
    // MESSAGE: No parameters
    if(stock === undefined) {
        msg.reply(`${config.signature}articles <symbol> requires a stock/crypto symbol to lookup!`);
        return;
    }
    stock = stock.toUpperCase();
    let fetch_time;
    let start_time = new Date().getTime();
    let links = await get_articles(stock);
    var scoring = {"lang":{"en":200},"source": {"InvestorPlace":3,"MarketWatch":3,"Business Insider":2, "Yahoo Finance":3},
    "hasPaywall": {"false": 100}};
    fetch_time = 'This result was fetched in '+ (new Date().getTime() - start_time) +"ms";
    if (links == "not found") {
      msg.reply("Invalid input! Please enter a valid ticker symbol.");
    }else if (links.length == 0 || links == "crypto") {
      msg.reply("Sorry, no articles found on "+stock);
    }else{
      var scored = score_articles(links,scoring);
      var TO_return = await sort_top_articles(scored,scoring);
      await embeded(TO_return,fetch_time,stock,msg);
    };
  };
  
  
  //function that will fetch all the articles
  async function get_articles(stock){
    var no_crypto = ["ETH", "BCH","LTC","NEO"];
    let to_return;
    await fetch('https://cloud.iexapis.com/stable/stock/'+stock+'/news/last/6?token='+keys.IEXCloud)
    .then(res => res.json())
    .then(json => {
      to_return = json;
    }).catch(err => {
      to_return = "not found";
    });
    if (no_crypto.includes(stock)) {
      to_return = "crypto";
    }
    return to_return;
  };
  
  
  // adds a score based on scoring to each json article response
  function score_articles(json,scoring){
    let all = [];
    let factors = Object.keys(scoring);
    for (var i = 0; i < json.length; i++) {
      var score = 0;
      var article = json[i];
      if (article.hasPaywall == false){
        article.hasPaywall = "false";
      }else {
        article.hasPaywall = "true";
      };
      for (var j = 0; j < factors.length; j++) {
        let each_factor = Object.keys(scoring[factors[j]]);//criteria value en, InvestorPlace-MarketWatch
        let factor_value = article[factors[j]];//article value en, business,true
        for (var z = 0; z < each_factor.length; z++) {
          if (article[factors[j]] == [each_factor[z]]) {
            score += scoring[factors[j]][each_factor[z]];
          };
        };
      };
      article.score = score;
      all.push(article);
    };
    return all;
  };
  
  //sorts articles based on their "score" property and returns top 3
  function sort_top_articles(scored,scoring){
    let all_scored = [];
    const len = scored.length;
    let index;
    let article;
    let to_return = [];
    while (all_scored.length != len) {
  
      let best = 0;
      for (var i = 0; i < scored.length; i++) {
        if (scored[i]["score"] >= best) {
          best = scored[i]["score"];
          article = scored[i];
          index = i;
        };
      };
      scored.splice(index,1);
      all_scored.push(article);
    };
    //getting rid non-eng, despite its score
    for (var i = 0; i < all_scored.length; i++) {
      if (all_scored[i].lang == "en") {
        to_return.push(all_scored[i]);
      };
    };
    if (to_return.length <= 3){
      return to_return.slice(0,to_return.length);
    }else{
      return to_return.slice(0,3);
    };
  };
  
  //reply with formulated embed
  async function embeded(top_3_articles,fetch_time,stock,msg){
  
    let embed = new Discord.MessageEmbed();
    embed.setTitle("Articles for "+stock);
    embed.setColor(0x34b7eb);
    for (var i = 0; i < top_3_articles.length; i++) {
      embed.addFields({
      name: top_3_articles[i]["headline"],
      value:"[ Press here ](" + top_3_articles[i]["url"] + ")"
      });
    };
    await embed.setThumbnail('https://storage.googleapis.com/iex/api/logos/'+stock+'.png');
    embed.setFooter(fetch_time);
    msg.reply(embed);
  };

  module.exports.sendArticles = sendArticles;