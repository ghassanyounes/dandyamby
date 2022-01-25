require('dotenv').config();

//const fetch = require('node-fetch');

var empty = {
  users: []
}
var config= {
  setupChannels: []
};

var user_info= {
  Name: "",
  Class: "",
  ID: 0,
  Gold: 0,
  TotalXP: 0,
  icon: ""
}

var fs = require('fs');
const util = require('util');
const { MessageEmbed } = require('discord.js');

let date_ob = new Date();

function printDate(){
// current date
// adjust 0 before single digit date
let date = ("0" + date_ob.getDate()).slice(-2);

// current month
let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);

// current year
let year = date_ob.getFullYear();

// current hours
let hours = ("0" + date_ob.getHours()).slice(-2);

// current minutes
let minutes = ("0" + date_ob.getMinutes()).slice(-2);

// current seconds
let seconds = ("0" + date_ob.getSeconds()).slice(-2);
return year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds + ' => ';
}

var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(printDate() + d) + '\n');
  log_stdout.write(util.format(printDate() + d) + '\n');
};

console.log('   \n\n\n   BOT STARTUP    \n\n\n   ');
console.log('Beep Beep!');

const { Client, Intents, MessageMentions: { CHANNELS_PATTERN } } = require('discord.js');
const myIntents = new Intents();
myIntents.add(Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILDS, 
              Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES);

const client = new Client({ intents: myIntents });
client.login(process.env.BOTTOKEN);

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', gotMessage);

client.on('guildMemberAdd', newMember);

process.on('uncaughtException', function (err) {
  console.log('Caught Exception: ' + err);
});

async function gotMessage(msg) {
  var msg_lower = msg.content.toLowerCase();
  fs.readFile('config.json', 'utf8', 
    function readFileCallback(err, data) {
      if (err) {
        console.log(err);
      } else {
        config = JSON.parse(data); //now it's an object
      }
    }
  );
  if (msg_lower.indexOf('%help') !== -1) {
    const ereply = new MessageEmbed()
    .setColor(/* SOME COLOR */)
    .setTitle(`HandyDandyAmby Support Manual`)
    .setDescription(`Loopking for help? You're in the right place.`)
    .addFields(
      { name: 'Check your points balance', value: "`%checkbalance" },
      { name: 'Set your photo', value: "`%setphoto https://www.url/to/image.png`" },
      { name: 'See this menu', value: "`%help`" },
    )
    .setFooter({text: 'Task Successful.\nBank of Outreach brought to you by Ghassan Younes'})
    if (msg.member.roles.cache.some((role) => role.name.toLowerCase() === 'botmanager')) {
      ereply.addFields(
        { name: 'Admin Only: Set Admin Channel', value: "`%setupchannel #channel`" },
        { name: 'Admin Only: Add a New Ambassador', value: "`%newamby Name Lastname, Class, @discord_user, Gold, XP, https://www.url/to/image.png`" },
        { name: 'Admin Only: Add Points', value: "`%addpoints @discord_user,##` where ## is the number of points. This will automatically update total XP" },
        { name: 'Admin Only: Withdraw Points', value: "`%subpoints @discord_user,##` where ## is the number of points." },
        { name: 'Admin Only: List All Ambassadors', value: "`%listall`" },
        { name: 'Admin Only: Look up an Ambassador', value: "`%lookup @discord_user`" },
        { name: 'Admin Only: Change an Ambassador Name', value: "`%setname @discord_user, New Name`" },
      )
    }
    msg.author.send({ embeds: [ereply] });
    msg.react('✔️');
  } else if (msg_lower.indexOf('%setupchannel ') !== -1) {
    if (msg.member.roles.cache.some((role) => role.name.toLowerCase() === 'botmanager')) {
      var setup_channel_id = msg_lower.match(CHANNELS_PATTERN);
      if (setup_channel_id == null)
        return;
      if (setup_channel_id.toString().startsWith('<#') && setup_channel_id.toString().endsWith('>')){
        setup_channel_id = setup_channel_id.toString().replace('<#','');
        setup_channel_id = setup_channel_id.toString().replace('>','');
      }
      if (!fs.existsSync('./users/' + msg.guild.id.toString())){
        fs.mkdir('./users/' + msg.guild.id.toString(), { recursive: true }, (err) => {
          if (err) 
            console.log(err);
          else
            console.log(`Folder Made - ${msg.guild.id.toString()}`);
        });
      }
      fs.readFile('config.json', 'utf8', 
        function readFileCallback(err, data) {
          if (err) {
            console.log(err);
          } else {
            config = JSON.parse(data); //now it an object
            if (!config.setupChannels.includes(setup_channel_id)) {
              config.setupChannels.push(setup_channel_id); //add some data
              json = JSON.stringify(config); //convert it back to json
              empty_j = JSON.stringify(empty); //convert it back to json
              fs.writeFile('config.json', json, 
                function(err) {
                  if (err) {
                    console.log(err);
                    msg.react('❌'); 
                  } else{
                    var filedir = './users/' + msg.guild.id.toString() + '/users.json';
                    fs.writeFile(filedir, empty_j, 
                      function(err) {
                        if (err) {
                          console.log('file ' + filedir + ' could not be made');
                          msg.react('❌'); 
                        }
                      }
                    );
                    console.log('added setup channel ' + setup_channel_id);
                    msg.react('✔️'); 
                  }
                }
              );
            } else {
              msg.react('❌'); 
              msg.reply('Channel <#' + setup_channel_id + '> already in use for setup!')
            }
          }
        }
      );
    } else {
      msg.react('❌'); 
      msg.reply('Sorry, you do not have adequate permissions to issue that command.')
    }
  } else if (config.setupChannels.includes(msg.channel.id.toString())) {
    // THIS IS WHERE ALL THE COMMANDS GO
    if (msg_lower.indexOf('%newamby ') !== -1) {
      var user_data = msg.content.replace('%newamby ','');
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      var params = user_data.split(',');

      for (let i = 0; i < params.length; i++){
        params[i] = params[i].replace(/^\s+/g, '');
        params[i] = params[i].replace(/\s+$/g, '');
      }

      if (params.length < 6) {
        msg.reply("That's not enough parameters! Please provide (comma-separated) the Ambassador Name, Class (Write N/A if unavailable), Discord User ID (You can @ their username for this too), Current Gold, Total XP, and a link to their photo!\nE.g. `Ghassan, Shawarma Sandwich, @explosivetortellini#6969, 69, 420, https://bit.ly/3tYOfzG`");
        return;
      }

      if (params[2].startsWith('<@!') && params[2].toString().endsWith('>')){
        params[2] = params[2].replace('<@!','');
        params[2] = params[2].replace('>','');
      }
      if (params[2].startsWith('<@') && params[2].toString().endsWith('>')){
        params[2] = params[2].replace('<@','');
        params[2] = params[2].replace('>','');
      }

      var repl = `New Ambassador: name: ${params[0]}, class: ${params[1]}, id: ${parseInt(params[2])}, gold: ${parseInt(params[3])}, xp: ${parseInt(params[4])}, icon: ${params[5]}`;
      assign_amby(user_info, params[0], params[1], parseInt(params[2]), parseInt(params[3]), parseInt(params[4]), params[5]);

      const ereply = new MessageEmbed()
      .setColor(/* SOME COLOR */)
      .setTitle(`Ambassador Registry`)
      .setDescription(`Admin Panel - Regsitering New User`)
      .setThumbnail(user_info.icon)
      .addFields(
        { name: 'Account Holder', value: `${user_info.Name}` },
        { name: 'Account Number', value: `${user_info.ID}` },
        { name: 'Class', value: `${user_info.Class}` },
        { name: 'Total XP', value: `${user_info.TotalXP}`, inline: true },
        { name: 'Available Gold', value: `${user_info.Gold}`, inline: true },
      )
      .setFooter({text: 'Task Successful.\nBank of Outreach brought to you by Ghassan Younes'});

      fs.readFile(filedir, 'utf8', 
        function readFileCallback(err, data) {
          if (err) {
              console.log('read error');
              console.log(err);
              msg.react('❌'); 
          } else {
            empty = JSON.parse(data); //now it an object
            empty.users.push(user_info); //add some data
            json = JSON.stringify(empty); //convert it back to json
            fs.writeFile(filedir, json, 
              function(err) {
                if (err) {
                  console.log('write error');
                  console.log(err);
                  msg.react('❌'); 
                }
                else {
                  console.log(repl);
                  msg.reply({ embeds: [ereply] });
                  msg.react('✔️');
                }
              }
            ); // write it back 
          }
        }
      );
    } else if (msg_lower.indexOf('%newamby') !== -1) {
      msg.reply("That's not enough parameters! Please provide (comma-separated) the Ambassador Name, Class (Write N/A if unavailable), Discord User ID (You can @ their username for this too), Current Gold, Total XP, and a link to their photo!\nE.g. `Ghassan, Shawarma Sandwich, @explosivetortellini#6969, 69, 420, https://bit.ly/3tYOfzG`");
      return;
    } else if (msg_lower.indexOf('%addpoints ') !== -1) {
      var user_data = msg_lower.replace('%addpoints ','');
      if (user_data.endsWith(' '))
        user_data = user_data.toString().slice(0,-1);
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      var params = user_data.split(',');


      if (params.length < 2) {
        msg.reply("That's not enough parameters! Please provide (comma-separated) the Discord User ID (You can @ their username for this too) and the amount of points to add!\nE.g. `@explosivetortellini#6969,420`")
        return;
      }


      if (params[0].startsWith('<@!') && params[0].endsWith('>')){
        params[0] = params[0].replace('<@!','');
        params[0] = params[0].replace('>','');
      }
      if (params[0].startsWith('<@') && params[0].endsWith('>')){
        params[0] = params[0].replace('<@','');
        params[0] = params[0].replace('>','');
      }

      let memberID = parseInt(params[0]);
      let addPoints = parseInt(params[1]);
      fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
        if (err) {
            console.log('read error adding points');
            console.log(err);
            msg.react('❌'); 
        } else {
          empty = JSON.parse(data); //now it an object
          user_info = empty.users.find(e => e.ID == memberID);
          empty.users.find(e => e.ID == memberID).Gold += addPoints;
          empty.users.find(e => e.ID == memberID).TotalXP += addPoints;
          user_info = empty.users.find(e => e.ID == memberID);
          json = JSON.stringify(empty); //convert it back to json
          fs.writeFile(filedir, json, 
            function(err) {
              if (err) {
                console.log('write error adding points');
                console.log(err);
                msg.react('❌'); 
              }
              else {
                console.log(`Added ${params[1]} gold to ${user_info.Name}, id ${params[0]}`);
                msg.reply(`New balance for ${user_info.Name} is ${user_info.Gold} out of ${user_info.TotalXP} total`);
                msg.react('✔️');
              }
            }
          ); // write it back 
        }
      }
      );
    } else if (msg_lower.indexOf('%subpoints ') !== -1) {
      var user_data = msg_lower.replace('%subpoints ','');
      if (user_data.endsWith(' '))
        user_data = user_data.toString().slice(0,-1);
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      var params = user_data.split(',');

      if (params.length < 2) {
        msg.reply("That's not enough parameters! Please provide (comma-separated) the Discord User ID (You can @ their username for this too) and the amount of points to withdraw!\nE.g. `@Punktu8#1958,11`")
        return;
      }

      if (params[0].startsWith('<@!') && params[0].endsWith('>')){
        params[0] = params[0].replace('<@!','');
        params[0] = params[0].replace('>','');
      }
      if (params[0].startsWith('<@') && params[0].endsWith('>')){
        params[0] = params[0].replace('<@','');
        params[0] = params[0].replace('>','');
      }

      let memberID = parseInt(params[0]);
      let subPoints = parseInt(params[1]);
      fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
        if (err) {
            console.log('read error subbing points');
            console.log(err);
            msg.react('❌'); 
        } else {
          empty = JSON.parse(data); //now it an object
          user_info = empty.users.find(e => e.ID == memberID);
          empty.users.find(e => e.ID == memberID).Gold -= subPoints;
          user_info = empty.users.find(e => e.ID == memberID);
          json = JSON.stringify(empty); //convert it back to json
          fs.writeFile(filedir, json, 
            function(err) {
              if (err) {
                console.log('write error subbing points');
                console.log(err);
                msg.react('❌'); 
              }
              else {
                console.log(`Withdrew ${params[1]} gold from ${user_info.Name}, id ${params[0]} ; ${user_info.Gold}/${user_info.TotalXP}`);
                msg.reply(`New balance for ${user_info.Name} is ${user_info.Gold} out of ${user_info.TotalXP} total`);
                msg.react('✔️');
              }
            }
          ); // write it back 
        }
      }
      );
    } else if (msg_lower.indexOf('%listall') !== -1) {
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
        if (err) {
            console.log('read error');
            console.log(err);
            msg.react('❌'); 
        } else {
          empty = JSON.parse(data); 
          var reply_message = "";
          for (let i = 0; i < empty.users.length; i++) {
            var temptext = parse_general(empty.users[i]);
            console.log(temptext);
            if (temptext)
              reply_message += temptext;
          }
          console.log(reply_message);
          msg.reply(reply_message);
        }
      }
      );
    } else if (msg_lower.indexOf('%lookup ') !== -1) {
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      var params = msg_lower.split(' ');

      if (params[1].startsWith('<@!') && params[1].endsWith('>')){
        params[1] = params[1].replace('<@!','');
        params[1] = params[1].replace('>','');
      }
      if (params[0].startsWith('<@') && params[1].endsWith('>')){
        params[1] = params[1].replace('<@','');
        params[1] = params[1].replace('>','');
      }

      let memberID = parseInt(params[1]);
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
        if (err) {
            console.log('read error');
            console.log(err);
            msg.react('❌'); 
        } else {
          empty = JSON.parse(data); 
          user_info = empty.users.find(e => e.ID == memberID);
          msg.reply({embeds: [parse_lookup(user_info)]});
        }
      }
      );
    } else if (msg_lower.indexOf('%setname ') !== -1) {
      var user_data = msg.content.replace('%setname ','');
      var filedir = './users/' + msg.guild.id.toString() + '/users.json';
      var params = user_data.split(',');

      for (let i = 0; i < params.length; i++){
        params[i] = params[i].replace(/^\s+/g, '');
        params[i] = params[i].replace(/\s+$/g, '');
      }
  
      if (params.length < 2) {
        msg.reply("That's not enough parameters! Please provide (comma-separated) the Discord User ID (You can @ their username for this too) and the new name!\nE.g. `@explosivetortellini#6969,Ghassan Younes`")
        return;
      }
  
      if (params[0].startsWith('<@!') && params[0].endsWith('>')){
        params[0] = params[0].replace('<@!','');
        params[0] = params[0].replace('>','');
      }
      if (params[0].startsWith('<@') && params[0].endsWith('>')){
        params[0] = params[0].replace('<@','');
        params[0] = params[0].replace('>','');
      }
  
      let memberID = parseInt(params[0]);
      fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
        if (err) {
            console.log('read error changing name');
            console.log(err);
            msg.react('❌'); 
        } else {
          empty = JSON.parse(data); //now it an object
          user_info = empty.users.find(e => e.ID == memberID);
          empty.users.find(e => e.ID == memberID).Name = params[1];
          user_info = empty.users.find(e => e.ID == memberID);
          json = JSON.stringify(empty); //convert it back to json
          fs.writeFile(filedir, json, 
            function(err) {
              if (err) {
                console.log('write error changing name');
                console.log(err);
                msg.react('❌'); 
              }
              else {
                console.log(`Changed name for ${user_info.Name} to ${params[1]}, user id ${params[0]}`);
                msg.react('✔️');
              }
            }
          ); // write it back 
        }
      }
      );
    } 
  } else if (msg_lower.indexOf('%checkbalance') !== -1) {
    var filedir = './users/' + msg.guild.id.toString() + '/users.json';
    fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
      if (err) {
          console.log('read error checking balance');
          console.log(err);
          msg.react('❌'); 
      } else {
        empty = JSON.parse(data); //now it an object
        user_info = empty.users.find(e => e.ID == msg.member.id);
        //json = JSON.stringify(empty); //convert it back to json
        console.log(parse_general(user_info));
        msg.reply({embeds: [parse_personal(user_info)]});
      }
    }
    );
  } else if (msg_lower.indexOf('%setphoto ') !== -1) {
    var user_data = msg_lower.replace('%setphoto ','');
    if (user_data.endsWith(' '))
      user_data = user_data.toString().slice(0,-1);
    var filedir = './users/' + msg.guild.id.toString() + '/users.json';
    var params = user_data.split(',');

    if (params.length < 2) {
      msg.reply("That's not enough parameters! Please provide (comma-separated) the Discord User ID (You can @ their username for this too) and the new photo link!\nE.g. `@explosivetortellini#6969,https://bit.ly/3tYOfzG`")
      return;
    }

    if (params[0].startsWith('<@!') && params[0].endsWith('>')){
      params[0] = params[0].replace('<@!','');
      params[0] = params[0].replace('>','');
    }
    if (params[0].startsWith('<@') && params[0].endsWith('>')){
      params[0] = params[0].replace('<@','');
      params[0] = params[0].replace('>','');
    }

    let memberID = parseInt(params[0]);
    fs.readFile(filedir, 'utf8', function readFileCallback(err,data){
      if (err) {
          console.log('read error changing photo');
          console.log(err);
          msg.react('❌'); 
      } else {
        empty = JSON.parse(data); //now it an object
        user_info = empty.users.find(e => e.ID == memberID);
        empty.users.find(e => e.ID == memberID).icon = params[1];
        user_info = empty.users.find(e => e.ID == memberID);
        json = JSON.stringify(empty); //convert it back to json
        fs.writeFile(filedir, json, 
          function(err) {
            if (err) {
              console.log('write error changing photo');
              console.log(err);
              msg.react('❌'); 
            }
            else {
              console.log(`Changed photo for ${user_info.Name} to ${params[1]}, user id ${params[0]}`);
              msg.react('✔️');
            }
          }
        ); // write it back 
      }
    }
    );
  } else if (msg_lower.indexOf('pull the lever kronk') !== -1) {
    msg.reply('http://25.media.tumblr.com/tumblr_lsxk1ndn7W1r2vs7so2_r1_250.gif');
    msg.channel.send('Why do we even have that lever?');
  }  
}

async function newMember(member) {
  console.log(`New member joined, ${member.user.username}`);
}

function assign_amby(amby, aname, clss, id, gold, xp, icon) {
  amby.Name = aname;
  amby.Class = clss;
  amby.ID = id;
  amby.Gold = gold;
  amby.TotalXP = xp;
  amby.icon = icon;
}

function parse_lookup(amby) {
  if (typeof amby == 'undefined'){
    return new MessageEmbed() /* .setDescription('Fail') */;
  }
  const embed = new MessageEmbed()
    .setColor(/* SOME COLOR */)
    .setTitle(`Ambassador Registry`)
    .setDescription(`Admin Panel - User Lookup`)
    .setThumbnail(amby.icon)
    .addFields(
      { name: 'Account Holder', value: `${amby.Name}` },
      { name: 'Account Number', value: `${amby.ID}` },
      { name: 'Class', value: `${amby.Class}` },
      { name: 'Total XP', value: `${amby.TotalXP}`, inline: true },
      { name: 'Available Gold', value: `${amby.Gold}`, inline: true },
    )
    .setFooter({text: 'Task Successful.\nBank of Outreach brought to you by Ghassan Younes'})

  return embed;
}

function parse_personal(amby) {
  if (typeof amby == 'undefined'){
    return new MessageEmbed() /* .setDescription('Fail') */;
  }
  const embed = new MessageEmbed()
    .setColor(/* SOME COLOR */)
    .setTitle(`Bank of Outreach`)
    .setDescription(`Welcome friend, to the Bank of Outreach.`)
    .setThumbnail(amby.icon)
    .addFields(
      { name: 'Account Holder', value: `${amby.Name}` },
      { name: 'Account Number', value: `${amby.ID}` },
      { name: 'Class', value: `${amby.Class}` },
      { name: 'Total XP', value: `${amby.TotalXP}`, inline: true },
      { name: 'Available Gold', value: `${amby.Gold}`, inline: true },
    )
    .setFooter({text: 'Thanks for your visit! Please come again'})

  return embed;
}

function parse_general(amby) { 
  if (typeof amby != 'undefined'){
    var output = `Ambassador ${amby.Name} - Member ID ${amby.ID}, class ${amby.Class}\n`;
    output += `Total XP: ${amby.TotalXP} | Available Gold: ${amby.Gold}\n`;
    output += `Assigned Photo: <${amby.icon}>\n\n`
    return output;
  } else {
    return " ";
  }
}