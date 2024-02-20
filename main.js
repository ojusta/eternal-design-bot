const Eris = require("eris");
const Constants = Eris.Constants
const vars = require('./vars.json');
const fs = require('fs').promises;
const { registerFont, createCanvas, loadImage } = require('canvas');
const client = new Eris.Client(vars.token, {
   intents: ["guilds", "guildMessages", "allPrivileged"]
});

registerFont('fonts/Dirtyline_36daysoftype_2022.otf', { family: 'Dirtyline' });
registerFont('fonts/digital_display_tfb.ttf', { family: 'Digital Display' });
registerFont('fonts/hemi_head_bd_it.ttf', { family: 'Hemi Head' });
registerFont('fonts/Trouble_Font.otf', { family: 'Trouble Font' });

class Usuario {
   constructor(nome, id) {
      this[id] = {
         nome: nome,
         id: id,
         ranking: 0,
         pontos: 0,
         contests: {
            ouro: 0,
            prata: 0,
            bronze: 0,
            participacoes: 0
         },
         overall: {
            preenchimento: "C-",
            colorCorrection: "C-",
            customText: "C-",
            paletaCores: "C-",
            consistencia: "C-",
            tecnica: "C-"
         }
      };
   }
}

async function addUser(nome, id) {
   if (!nome || !id) return "❌ Você não informou o nome e/ou não mencionou o usuário";

   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);

      if (json.membros.some(membro => membro.hasOwnProperty(id))) return "❌ Este usuário já existe no banco de dados";

      json.membros.push(new Usuario(nome, id));
      const jsonU = JSON.stringify(json, null, 2);

      await fs.writeFile('tabela.json', jsonU, 'utf8');
      return '✅ Usuário adicionado com sucesso!';
   } catch (err) {
      console.error('Erro ao ler ou escrever no arquivo JSON:', err);
      return '❌ Erro ao adicionar usuário';
   }
}

async function removeUser(nome) {
   if (!nome) return "❌ Você não informou um nome para remover"

   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);

      const indexFind = json.membros.findIndex(membro => {
         const membroID = Object.keys(membro)[0];
         return membro[membroID].nome === nome;
      });

      if ((!indexFind) || (indexFind === -1)) return "❌ Não encontrei o usuário que você digitou"

      json.membros.splice(indexFind, 1);
      const jsonU = JSON.stringify(json, null, 2);

      await fs.writeFile('tabela.json', jsonU, 'utf8');
      await updateRanking();
      return "Usuário removido com sucesso do banco de dados"
   } catch (err) {
      console.error('Erro ao ler ou escrever no arquivo JSON:', err);
   }
}

async function editUser(check, input) {
   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);
      const keys = ['pontos', 'contests', 'overall'];
      let checkString = String(check);
     if (!Number(check)) {
         foundUser = json.membros.find(membro => {
            const membroID = Object.keys(membro)[0];
            return membro[membroID].nome === checkString;
         });
         if((!foundUser) || (foundUser === -1)) return "❌ Não encontrei o usuário pelo nome.";
         checkString = Object.keys(foundUser)[0];
      } 
      else {
         if (!json.membros.some(membro => membro.hasOwnProperty(checkString))) return "❌ Não encontrei o usuário pela menção.";
         foundUser = json.membros.find(user => user[checkString])
      }

      let count = 0;
      keys.forEach((key, index) => {
         if (index === 0) {
            foundUser[checkString][key] = parseInput(input[count], foundUser[checkString][key]);
            count++;
         } else {
            Object.entries(foundUser[checkString][key]).forEach(([subKey, value], subIndex) => {
               foundUser[checkString][key][subKey] = parseInput(input[count], value);
               count++;
            });
         }
      });

     const jsonU = JSON.stringify(json, null, 2);
     await fs.writeFile('tabela.json', jsonU, 'utf8');
     await updateRanking();
     return '✅ Dados do usuário atualizados com sucesso';
   } catch (err) {
      console.error('Erro ao ler ou escrever no arquivo JSON:', err);
   }
}

async function editUserSoma(check, input) {
   try {
      if(check.length < 4 || input.length < 4) return console.log("ESCREVE DIREITO PORRA")
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);
      const keys = ['pontos', 'contests'];
      let msgErro = "❌ Encontrei um ou mais usuários que não estão dentro do banco de dados, adicione eles antes de tentar usar esse comando: ";
      let inputFinal = [];

      array1 = [input[0], 1, null, null, null]
      array2 = [input[1], null, 1, null, null]
      array3 = [input[2], null, null, 1, null]
      array4 = [input[3], null, null, null, 1]
      inputFinal.push(array1, array2, array3, array4);

      for (let index = 0; index < check.length; index++) {
         let checkItem = check[index];
         if (checkItem !== null && !json.membros.some(membro => membro.hasOwnProperty(checkItem))) {
            msgErro += `<@${checkItem}> `
        }
      }

      if(msgErro.length > 121) return msgErro;

      check.forEach((checkItem, index) => {
         let checkString = String(checkItem);
         let count = 0;

         if(checkItem === null) return;
         foundUser = json.membros.find(user => user[checkString]);

         
         keys.forEach((key, keyIndex) => {
            if (keyIndex === 0) {
               foundUser[checkString][key] += parseInput(inputFinal[index][count], 0);
               count++;
            } else {
               Object.entries(foundUser[checkString][key]).forEach(([subKey]) => {
                  foundUser[checkString][key][subKey] += parseInput(inputFinal[index][count], 0);
                  count++;
               });
            }
         });
      });
      const jsonU = JSON.stringify(json, null, 2);
      await fs.writeFile('tabela.json', jsonU, 'utf8');
      await updateRanking();
      return '✅ Pontos e medalhas adicionadas aos seus respectivos membros!';
   } catch (err) {
      console.error('Erro ao ler ou escrever no arquivo JSON:', err);
   }
}

async function resetAllUsers() {
   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);

      json.membros.forEach(membro => {
         membro[Object.keys(membro)[0]].pontos = 0;
         membro[Object.keys(membro)[0]].contests = {
             ouro: 0,
             prata: 0,
             bronze: 0,
             participacoes: 0
         };
     });

      const jsonU = JSON.stringify(json, null, 2);
      await fs.writeFile('tabela.json', jsonU, 'utf8');
      await updateRanking();
      return '✅ Os pontos, medalhas e participações de todos os usuários foram resetados';
   } catch (err) {
      console.error('Erro ao ler ou escrever no arquivo JSON:', err);
   }
}

async function getAllUsers() {
   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);
      let membros = [];

      if(json.membros.length == 0) return "Não tem nenhum membro cadastrado no banco de dados";

      json.membros.forEach(membro => {
         let valorOverall = membro[Object.keys(membro)[0]].overall
         let resultado = categoriaPontuacao({ overall: valorOverall });
         membros.push(`<@${membro[Object.keys(membro)[0]].id}> - ${membro[Object.keys(membro)[0]].nome} (${resultado.mediaFinal})`);
      });
      membros.sort((a, b) => {
         const notaA = a.match(/\(([^)]+)\)/)[1]; // Extrai a nota entre parênteses
         const notaB = b.match(/\(([^)]+)\)/)[1];
     
         // Compara as notas utilizando o objeto 'notas' como referência
         return obterValorNota(notaA) - obterValorNota(notaB);
     });

      return membros;
   } catch (err) {
      console.error('Erro ao ler o arquivo JSON:', err);
   }
}

async function getAllUsersMedia() {
   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);

      if(json.membros.length == 0) return false;
      
      let count = 0;
      let soma = 0;
      json.membros.forEach(membro => {
         if(membro[Object.keys(membro)[0]].id === "206470647143071744") return;
         let valorOverall = membro[Object.keys(membro)[0]].overall
         let resultado = categoriaPontuacao({ overall: valorOverall });
         count++
         soma += resultado.media
      });
      const media = soma / count
      const mediaFinal = obterNotaCategoria(media);
      const cor = obterCorPorNota(mediaFinal);
      return  {count, mediaFinal, cor}
   } catch (err) {
      console.error('Erro ao ler o arquivo JSON:', err);
   }
}

async function checkUser(check) {
   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      const json = JSON.parse(data);

      if (!Number(check)) {
         const foundUser = json.membros.find(membro => {
            const membroID = Object.keys(membro)[0];
            return membro[membroID].nome === check;
         });
         if(!foundUser) return false;

         return foundUser[Object.keys(foundUser)[0]];
         } 
         else {
           const checkString = String(check);
           if (!json.membros.some(membro => membro.hasOwnProperty(checkString))) return false;

           return json.membros.find(membro => Object.keys(membro)[0] === checkString)[Object.keys(json.membros.find(membro => Object.keys(membro)[0] === checkString))[0]];
         }
   } catch (error) {
       console.error('Erro na leitura do arquivo:', error);
       throw error;
   }
}

async function updateRanking() {
   try {
      const data = await fs.readFile('tabela.json', 'utf8');
      let json = JSON.parse(data);
      
      json.membros.sort((a, b) => b[Object.keys(b)].pontos - a[Object.keys(a)].pontos);
      let ranking = 1;
      json.membros.forEach((membro, index) => {
         if(membro[Object.keys(membro)[0]].id === "206470647143071744") return;
            if (index > 0 && membro[Object.keys(membro)].pontos !== json.membros[index - 1][Object.keys(json.membros[index - 1])].pontos) {
               ranking = index + 1;
            }
            membro[Object.keys(membro)].ranking = ranking;
        });

      const canalRanking = client.guilds.get('764494990617346098').channels.get('1056261297446076467')
      const msgRanking = canalRanking.getMessage(json.canalranking.id)
      let desc = `# 🏆__Eternal Ranking__🏆\n\n\n`
      json.membros.forEach(membro => {
         const membroID = Object.keys(membro)[0];
         const pontos = membro[membroID].pontos
         if(pontos > 0){
            switch (membro[membroID].ranking){
               case 1:
                  desc += `### 🥇 - ${membro[membroID].nome}: ${membro[membroID].pontos} pontos\n`
                  break;
               case 2:
                  desc += `### 🥈 - ${membro[membroID].nome}: ${membro[membroID].pontos} pontos\n`
                  break;
               case 3:
                  desc += `### 🥉 - ${membro[membroID].nome}: ${membro[membroID].pontos} pontos\n`
                  break;
               default:
                  desc += `**${membro[membroID].ranking}**° Posição - ${membro[membroID].nome}: ${membro[membroID].pontos} pontos\n`;
            }
         }
      });
        const embed = {
         description: desc,
         color: 14873597,
         footer: {
            text: `Atualizado pela última vez: ${dataFormatada()}`
         },
         image: {
            url: "https://cdn.discordapp.com/attachments/264143132092792833/1199796281032314942/banner_relaxa_que_o_pai_agora_acertou.png?ex=65c3d85c&is=65b1635c&hm=dd3fa23cc150d48604da1f54c7468159dd02c8d74e15c163a101663ba003b5da&"
          }
      }
        if (msgRanking) {
         msgRanking.then((msg) => {
            msg.edit({embed: embed});
         });
      } 
      else {
         await canalRanking.createMessage({embed: embed}).then(msg=>{
            json.canalranking.id = msg.id
         })
      }
      const novoConteudoJSON = JSON.stringify(json, null, 2);
      await fs.writeFile('tabela.json', novoConteudoJSON, 'utf8');
   } catch (err) {
      console.error('Erro:', err);
   }
}

function parseInput(input, defaultValue) {
   return input !== null ? input : defaultValue;
}

function dataFormatada() {
   const data = new Date()
   const meses = [
       "Janeiro", "Fevereiro", "Março",
       "Abril", "Maio", "Junho",
       "Julho", "Agosto", "Setembro",
       "Outubro", "Novembro", "Dezembro"
   ];

   const dia = data.getDate();
   const mes = meses[data.getMonth()];
   const ano = data.getFullYear();
   const horas = padZero(data.getHours());
   const minutos = padZero(data.getMinutes());

   return `${dia} de ${mes} de ${ano} às ${horas}:${minutos}`;
}

function padZero(numero) {
   return numero < 10 ? `0${numero}` : numero;
}

function obterNotaCategoria(valor) {
   if (typeof valor === "number") {
      switch (true) {
         case valor === 100:
            return "SS";
         case valor >= 91.6:
            return "S";
         case valor >= 83.3:
            return "S-";
         case valor >= 75:
            return "A+";
         case valor >= 66.6:
            return "A";
         case valor >= 58.3:
            return "A-";
         case valor >= 50:
            return "B+";
         case valor >= 41.3:
            return "B";
         case valor >= 33.3:
            return "B-";
         case valor >= 25:
            return "C+";
         case valor >= 16.6:
            return "C";
         case valor >= 8.3:
            return "C-";
         case valor < 8.3:
            return "C-";
         default:
            return "Nota inválida";
      }
   } else {
      switch (valor) {
         case "SS":
            return 100;
         case "S":
            return 91.6;
         case "S-":
            return 83.3;
         case "A+":
            return 75;
         case "A":
            return 66.6;
         case "A-":
            return 58.3;
         case "B+":
            return 50;
         case "B":
            return 41.3;
         case "B-":
            return 33.3;
         case "C+":
            return 25;
         case "C":
            return 16.6;
         case "C-":
            return 8.3;
         default:
            return "Nota inválida";
      }
   }
}

function obterCorPorNota(nota) {
   switch (nota) {
      case "C-":
         return 8410639;
      case "C":
         return 10449982;
      case "C+":
         return 13489105;
      case "B-":
         return 15529715;
      case "B":
         return 9752279;
      case "B+":
         return 2011077;
      case "A-":
         return 10908400;
      case "A":
         return 14511861;
      case "A+":
         return 2401889;
      case "S-":
         return 10950451;
      case "S":
         return 14428492;
      case "SS":
         return 15316313;
      default:
         return 8410639;
   }
}

function categoriaPontuacao(obj) {
   let categorias = [];
   let somaPontuacoes = 0;

   for (const categoria in obj.overall) {
       const pontuacao = obterNotaCategoria(obj.overall[categoria]);
       somaPontuacoes += pontuacao === "C-" ? 8.3 : pontuacao; // Considerando C- como 8.3
       categorias.push(obj.overall[categoria]);
   }

   const media = somaPontuacoes / Object.keys(obj.overall).length;
   const mediaFinal = obterNotaCategoria(media);
   const cor = obterCorPorNota(mediaFinal);
   const corTeia = obterCorTeia(mediaFinal)

   return { media, mediaFinal, categorias, cor, corTeia};
}

function logChannel(comando, canal, input, userMembro, userAfetado){
   let categorias = ['Pontos', '🥇', '🥈', '🥉', '🚩', 'PR', 'CC', 'CT', 'PC', 'CO', 'PT'];
   const guildID = "764494990617346098";
   const canalLogID = "1199869046041100288";
   const canalLog = client.guilds.get(guildID).channels.get(canalLogID);
   let inputFormatado = "";

   switch(comando) {
      case "add":
         inputFormatado = `Adicionar um usuário: <nome: ${input[0]}> <menção: <@${input[1]}>> `;
         break;
      case "remove":
         inputFormatado = `Remover um usuário com o nome de ${input}`;
         break;
      case "edit":
         inputFormatado = `Editar os valores do usuário <@${userAfetado}> \n\n **Valores alterados:** \n`
         for (let i = 0; i < input.length; i++) {
            if (input[i] !== null) {
               const categoria = categorias[i];
               inputFormatado += `*${categoria}*: ${input[i]} `
               if(i === 0 || i === 4) inputFormatado += "\n"
            }
         }
         break;
      case "grtop3":
         inputFormatado = `Top 3 Contest gringo para:\n
         <@${userAfetado[0]}>: ${input[0]} pontos e 1🥇\n
         <@${userAfetado[1]}>: ${input[1]} pontos e 1🥈\n
         <@${userAfetado[2]}>: ${input[2]} pontos e 1🥉\n`
         break;
      case "brtop3":
         inputFormatado = `Top 3 Contest brasileiro para:\n
         <@${userAfetado[0]}>: ${input[0]} pontos e 1🥇\n
         <@${userAfetado[1]}>: ${input[1]} pontos e 1🥈\n
         <@${userAfetado[2]}>: ${input[2]} pontos e 1🥉\n`
         break;
      case "cotop3":
         inputFormatado = `Top 3 Collab para:\n
         <@${userAfetado[0]}>: ${input[0]} pontos e 1🥇\n
         <@${userAfetado[1]}>: ${input[1]} pontos e 1🥈\n
         <@${userAfetado[2]}>: ${input[2]} pontos e 1🥉\n`
         break;
      case "resetpontuacoes":
         inputFormatado = `Os pontos, medalhas e participações de todos os membros foram resetados`;
         break;
      case "Adicionar os pontos do Contest":
         inputFormatado = `Pontos de participação de Contest para:
         <@${userAfetado[3]}>: ${input[3]} pontos e 1🚩\n`
         break;
      case "Adicionar os pontos do Collab":
         inputFormatado = `Pontos de participação do Collab para:
         <@${userAfetado[3]}>: ${input[3]} pontos e 1🚩\n`
         break;
      case "Adicionar os pontos do Poster":
         inputFormatado = `Pontos de participação de Poster para:
         <@${userAfetado[3]}>: ${input[3]} pontos e 1🚩\n`
         break;
   }
   const embed = { 
          "description": `**${userMembro.username}** usou um comando` ,
          "color": 3553599,
          "fields": [
            {
              "name": "Canal",
              "value": `${canal.mention} (${canal.name})`
            },
            {
              "name": "**Comando: **" + comando,
              "value": inputFormatado
            }
          ],
          "author": {
            "name": client.user.username + " Log",
            "icon_url": client.user.avatarURL
          },
          "footer": {
            "text": `${userMembro.username} às ${dataFormatada()}`,
            "icon_url": userMembro.avatarURL
          }
    }
   canalLog.createMessage({embed: embed})
}

function formatarNumero(numero) {
   let numeroFormatado = parseFloat(numero).toFixed(1);
   return numeroFormatado.endsWith('.0') ? parseFloat(numero).toFixed(0) : parseFloat(numero).toFixed(1);
}

function desenharCirculoNotas(ctx, x, y, radius, text) {
   ctx.globalAlpha = 0; // Deixar o círculo invisível
   // Desenhar o círculo
   ctx.beginPath();
   ctx.arc(x, y, radius, 0, Math.PI * 2);
   ctx.stroke();
   
   // Colocar o texto no centro do círculo
   ctx.fillStyle = "#fafbfc";
   ctx.textDrawingMode = 'glyph'
   ctx.globalAlpha = 1;
   ctx.font = '90px "Dirtyline"';
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';
   ctx.fillText(text, x, y);
}

function desenharNomeRankingMedia(ctx, nome, nota, rank, pontos) {
   ctx.fillStyle = "#fafbfc";
   ctx.textDrawingMode = 'glyph'
   ctx.globalAlpha = 1;
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';

   ctx.font = '65.14px "Dirtyline"'; // Nome
   ctx.fillText(nome, 200, 112);

   ctx.font = '108px "Digital Display"'; // Média
   let notaFormatada = formatarNumero(nota);
   ctx.fillText(notaFormatada, 200, 559);

   ctx.font = '35.86px "Trouble Font"'; // Rank e pontos
   ctx.fillText(`Rank ${rank} - ${pontos} pontos`, 200, 175);

}

function desenharPodioParticipacoes(ctx, valores) {
   ctx.fillStyle = "#fafbfc";
   ctx.textDrawingMode = 'glyph'
   ctx.globalAlpha = 1;
   ctx.textAlign = 'left';
   ctx.textBaseline = 'alphabetic';
   ctx.font = '48.4px "Hemi Head"';

   ctx.fillText(valores.ouro, 153, 901); // Ouro
   ctx.fillText(valores.prata, 298, 901); // Prata
   ctx.fillText(valores.bronze, 445 , 901); // Bronze
   ctx.fillText(valores.participacoes, 409, 965); // Participações
}

function obterValorNota(nota) {
   const notas = {
       'SS': 0,
       'S': 1,
       'S-': 2,
       'A+': 3,
       'A': 4,
       'A-': 5,
       'B+': 6,
       'B': 7,
       'B-': 8,
       'C+': 9,
       'C': 10,
       'C-': 11
   };

   return notas[nota] !== undefined ? notas[nota] : 11;
}

function obterCorTeia(nota) {
   const notas = {
       'SS': "#ffc000",
       'S': "#ff1743",
       'S-': "#c11433",
       'A+': "#13cf5a",
       'A': "#fa6ef9",
       'A-': "#a252eb",
       'B+': "#10b5f2",
       'B': "#74cfd8",
       'B-': "#e8f6f3",
       'C+': "#ccd4d2",
       'C': "#bf803d",
       'C-': "#9f640b"
   };

   return notas[nota] !== undefined ? notas[nota] : "#9f640b";
}

function desenharTeiaNota(ctx, notas, cor) {
ctx.lineWidth = 4;
ctx.strokeStyle = cor;
ctx.lineJoin = "miter";
ctx.beginPath();

ctx.moveTo(749 + (10.92 * obterValorNota(notas[0])), 329 + (18.92 * obterValorNota(notas[0]))); // mover topo esquerda
ctx.lineTo(618 + (21.91 * obterValorNota(notas[1])), 556 + (0 * obterValorNota(notas[1]))); // esquerda
ctx.lineTo(748 + (11 * obterValorNota(notas[2])), 783 - (18.91 * obterValorNota(notas[2]))); // inferior esquerda
ctx.lineTo(1012 - (11 * obterValorNota(notas[3])), 784 - (19 * obterValorNota(notas[3]))); // inferior direita
ctx.lineTo(1145 - (22.08 * obterValorNota(notas[4])), 556 - (0 * obterValorNota(notas[4]))); // direita
ctx.lineTo(1012 - (11 * obterValorNota(notas[5])), 329 - (-18.92 * obterValorNota(notas[5]))); // topo direita
ctx.lineTo(749 + (10.92 * obterValorNota(notas[0])), 329 + (18.92 * obterValorNota(notas[0]))); // topo esquerda

ctx.stroke();
} 

function desenharCirculoProfile(ctx, img) {
   ctx.fillStyle = "#fafbfc";
   ctx.beginPath();
   ctx.arc(200, 337, 100, 0, Math.PI * 2, true); // x, y, radius, startangle, endangle, counterclockwise
   ctx.closePath();
   ctx.clip(); 

   ctx.drawImage(img, 101, 238, 200, 200);
}

client.on("ready", async () => {
   const guildID = "764494990617346098";
   const commands = await client.getGuildCommands(guildID);

   if(!commands.length) {

      await client.createGuildCommand(guildID, { // help
         name: "help",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "Comando para saber todos os comandos do bot"
      });

      await client.createGuildCommand(guildID, { // profile
         name: "profile",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "Checa o perfil de um usuário.",
         options: [
            {
                "name": "nome",
                "description": "Digite o nome do usuário",
                "type": Constants.ApplicationCommandOptionTypes.STRING, 
                "required": false
            },
            {
               "name": "menção",
               "description": "Mencione o usuário",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": false
           }
         ]
      });

      await client.createGuildCommand(guildID, { // overall
         name: "overall",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "Mostra a média do Overall de todos os membros do time Eternal Design"
      });

      await client.createGuildCommand(guildID, { // add
      name: "add",
      type: Constants.ApplicationCommandTypes.CHAT_INPUT,
      description: "Adicionar um usuário ao banco de dados",
      options: [
          {
              "name": "nome",
              "description": "Digitar o nome do usuário",
              "type": Constants.ApplicationCommandOptionTypes.STRING, 
              "required": true
          },
          {
              "name": "menção",
              "description": "Digite a menção do usuário",
              "type": Constants.ApplicationCommandOptionTypes.USER,
              "required": true
          }
      ]
      });

      await client.createGuildCommand(guildID, { // remove
      name: "remove",
      type: Constants.ApplicationCommandTypes.CHAT_INPUT,
      description: "Remove um usuário do banco de dados.",
      options: [
         {
             "name": "nome",
             "description": "Digitar o nome do usuário",
             "type": Constants.ApplicationCommandOptionTypes.STRING, 
             "required": true
         }
      ]
      });
      
      await client.createGuildCommand(guildID, { // edit
      name: "edit",
      type: Constants.ApplicationCommandTypes.CHAT_INPUT,
      description: "Edita os dados de um usuário.",
      options: [ 
         {
             "name": "menção",
             "description": "Mencione o usuário",
             "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE, 
             "required": true
         },
         {
            "name": "pontos",
            "description": "Digite a quantidade de pontos",
            "type": Constants.ApplicationCommandOptionTypes.INTEGER, 
            "required": false
         },
         {
            "name": "ouro",
            "description": "Digite a quantidade de medalhas de ouro",
            "type": Constants.ApplicationCommandOptionTypes.INTEGER, 
            "required": false
         },
         {
            "name": "prata",
            "description": "Digite a quantidade de medalhas de prata",
            "type": Constants.ApplicationCommandOptionTypes.INTEGER, 
            "required": false
         },
         {
            "name": "bronze",
            "description": "Digite a quantidade de medalhas de bronze",
            "type": Constants.ApplicationCommandOptionTypes.INTEGER, 
            "required": false
         },
         {      
            "name": "participações",
            "description": "Digite a quantidade de participações",
            "type": Constants.ApplicationCommandOptionTypes.INTEGER, 
            "required": false
         },
         {
            "name": "preenchimento",
            "description": "Digite a nota de Preenchimento",
            "type": Constants.ApplicationCommandOptionTypes.STRING, 
            "required": false
         },
         {
            "name": "color-correction",
            "description": "Digite a nota de Color Correction",
            "type": Constants.ApplicationCommandOptionTypes.STRING, 
            "required": false
         },
         {
            "name": "custom-text",
            "description": "Digite a nota de Custom Text",
            "type": Constants.ApplicationCommandOptionTypes.STRING, 
            "required": false
         },
         {
            "name": "paleta-de-cores",
            "description": "Digite a nota de Paleta de Cores",
            "type": Constants.ApplicationCommandOptionTypes.STRING, 
            "required": false
         },
         {
            "name": "consistência",
            "description": "Digite a nota de Consistência",
            "type": Constants.ApplicationCommandOptionTypes.STRING, 
            "required": false
         },
         {
            "name": "parte-técnica",
            "description": "Digite a nota da Parte Técnica",
            "type": Constants.ApplicationCommandOptionTypes.STRING, 
            "required": false
         }
      ]
      });

      await client.createGuildCommand(guildID, { // grtop3
      name: "grtop3",
      type: Constants.ApplicationCommandTypes.CHAT_INPUT,
      description: "Adiciona os pontos e medalhas do contest gringo",
      options: [
         {
            "name": "top1",
            "description": "Mencione o usuário top 1",
            "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
            "required": true
         },
         {
            "name": "top2",
            "description": "Mencione o usuário top 2",
            "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
            "required": true
         },
         {
            "name": "top3",
            "description": "Mencione o usuário top 3",
            "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
            "required": true
         }
      ]
      });

      await client.createGuildCommand(guildID, { // brtop3
         name: "brtop3",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "Adiciona os pontos e medalhas do contest brasileiro",
         options: [
            {
               "name": "top1",
               "description": "Mencione o usuário top 1",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": true
            },
            {
               "name": "top2",
               "description": "Mencione o usuário top 2",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": true
            },
            {
               "name": "top3",
               "description": "Mencione o usuário top 3",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": true
            }
         ]
      });

      await client.createGuildCommand(guildID, { // cotop3
         name: "cotop3",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "Adiciona os pontos e medalhas de um contest",
         options: [
            {
               "name": "top1",
               "description": "Mencione o usuário top 1",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": true
            },
            {
               "name": "top2",
               "description": "Mencione o usuário top 2",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": true
            },
            {
               "name": "top3",
               "description": "Mencione o usuário top 3",
               "type": Constants.ApplicationCommandOptionTypes.MENTIONABLE,
               "required": true
            }
         ]
      });
      
      await client.createGuildCommand(guildID, { // profilelist
         name: "profilelist",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "Mostra uma lista com todos os usuários cadastrados no banco de dados"
      });

      await client.createGuildCommand(guildID, { // participação contest
      name: "Adicionar os pontos do Contest",
      type: Constants.ApplicationCommandTypes.MESSAGE
      });

      await client.createGuildCommand(guildID, { // participação collab
      name: "Adicionar os pontos do Collab",
      type: Constants.ApplicationCommandTypes.MESSAGE
      });

      await client.createGuildCommand(guildID, { // participação poster
      name: "Adicionar os pontos do Poster",
      type: Constants.ApplicationCommandTypes.MESSAGE
      });

      await client.createGuildCommand(guildID, { // resetpontuações
         name: "resetpontuacoes",
         type: Constants.ApplicationCommandTypes.CHAT_INPUT,
         description: "***NÃO UTILIZE ESSE COMANDO*** Reseta os pontos, medalhas e participações de todos os usuários.",
         options: [
         {
            "name": "confirmacao1",
            "description": "VOCÊ TEM CERTEZA DE QUE QUER RESETAR OS STATUS?",
            "type": Constants.ApplicationCommandOptionTypes.BOOLEAN,
            "required": true
         },
         {
            "name": "confirmacao2",
            "description": "VOCÊ TEM ABSOLUTA CERTEZA DE QUE QUER RESETAR OS STATUS?",
            "type": Constants.ApplicationCommandOptionTypes.BOOLEAN,
            "required": true
         },
         {
            "name": "confirmacao3",
            "description": "VOCÊ TEM ABSOLUTA CERTEZA ABSOLUTA DE QUE QUER RESETAR OS STATUS?",
            "type": Constants.ApplicationCommandOptionTypes.BOOLEAN,
            "required": true
         }
         ]
      });
   }
console.log('Eternal Design tá vivo')
});

client.on("interactionCreate", async interaction => {
   if (!interaction instanceof Eris.ComponentInteraction) return;

   /*if(interaction.data.component_type === 2 && interaction.data.custom_id === "botao"){
      return interaction.createMessage({
         content: "tu é bobo",
         flags: 64
      });
   }*/
   if(interaction.data.name == "help"){
      const embed = {
         description: `# Comandos disponíveis:\n‎‎
         **/profile** <Menção ou Nome> - Pesquisa o perfil do usuário, se não houver um parâmetro, mostra o perfil do usuário (se houver)\n
         **/overall** - Mostra a média do Overall de todos os membros do time Eternal Design cadastrados\n
         `,
         color: 14873597,
         }
      if(vars.admins.includes(interaction.member.id)){
         embed.description += `**/add** <nome> <menção> - Adiciona um membro no banco de dados\n
         **/remove** <nome> - Remove um membro do banco de dados\n
         **/edit**   <menção> <parâmetros> - Edita as informações de um membro do banco de dados\n
         **/profilelist** - Mostra uma lista com todos os usuários cadastrados no banco de dados\n
         **/grtop3** <menção top1> <menção top2> <menção top3> - Adiciona os pontos e as medalhas de ouro, prata e bronze para os respectivos membros ganhadores do contest gringo\n
         **/brtop3** <menção top1> <menção top2> <menção top3> - Adiciona os pontos e as medalhas de ouro, prata e bronze para os respectivos membros ganhadores do contest brasileiro\n
         **/cotop3** <menção top1> <menção top2> <menção top3> - Adiciona os pontos e as medalhas de ouro, prata e bronze para os respectivos membros ganhadores do collab\n
         **/resetpontuações** - Reseta os pontos, medalhas e participações de todos os usuários. ***NÃO UTILIZE ESSE COMANDO A NÃO SER QUE VOCÊ QUEIRA RESETAR OS STATUS DE TODO MUNDO***
         \n‎
         \n‎
         \n‎`
         embed.fields = [{
            "name": "Comandos por Apps",
            "value": `Para utilizar esses comandos você precisa clicar com o botão direito em uma mensagem de um usuário e depois ir em Apps.\n
            **Adicionar os pontos do Collab** - Adiciona os pontos e a bandeirinha de participação de um usuário no Collab\n
            **Adicionar os pontos do Contest** - Adiciona os pontos e a bandeirinha de participação de um usuário no Contest\n
            **Adicionar os pontos do Collab** - Adiciona os pontos e a bandeirinha de participação de um usuário no Poster\n`
         }]
      }
      return interaction.createMessage({embed: embed})
   };

   if(interaction.data.name == "profile"){
      let check = interaction.data.options ? interaction.data.options[0].value : interaction.member.id
      interaction.defer().then(() => {
      checkUser(check)
      .then(async obj => {
         if(!obj) return interaction.createMessage('Não encontrei esse usuário no banco de dados')
         let thumbnailURL = interaction.channel.guild.members.get(obj.id).avatarURL
         let notas = Object.values(obj.overall);
         let resultado = categoriaPontuacao({ overall: notas });
         /*const embed = {
            description: `# __${obj.nome}'s Info__\n\n\n
            ### Rank ${obj.ranking} - ${obj.pontos} pontos\n\n\n                
            ### **🥇${obj.contests.ouro} 🥈${obj.contests.prata} 🥉${obj.contests.bronze} 🚩${obj.contests.participacoes}**\n\n
            ### **Overall:** ${resultado.mediaFinal}\n
            **Preenchimento:** ${resultado.categorias[0]}
            **Color Correction:** ${resultado.categorias[1]}
            **Custom Text:** ${resultado.categorias[2]}
            **Paleta de Cores:** ${resultado.categorias[3]}
            **Consistência:** ${resultado.categorias[4]}
            **Parte Técnica:** ${resultado.categorias[5]}`,
            color: resultado.cor,
            thumbnail: { url: thumbnailURL}
         }*/


         const canvas = createCanvas(1430, 1080);
         const ctx = canvas.getContext('2d');
         const profimg = await loadImage(thumbnailURL);

         loadImage(`images/${resultado.mediaFinal}.png`).then((image) => {
            // Desenhar a imagem de fundo no canvas
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            // Definir as coordenadas e o texto para os círculos
            const circles = [
       { x: 679, y: 210, radius: 50, text: notas[0].toLowerCase() }, // Topo Esquerda - Preenchimento 
       { x: 470, y: 570, radius: 50, text: notas[1].toLowerCase() }, // Esquerda - Color Correction 
       { x: 679, y: 926, radius: 50, text: notas[2].toLowerCase() }, // Inferior Esquerda - Custom Text
       { x: 1081, y: 926, radius: 50, text: notas[3].toLowerCase() }, // Inferior Direita - Paleta de Cores
       { x: 1288, y: 570, radius: 50, text: notas[4].toLowerCase() }, // Direita - Consistência
       { x: 1081, y: 210, radius: 50, text: notas[5].toLowerCase() },  // Topo Direita - Parte Técnica
            ];

            circles.forEach(circle => {
               desenharCirculoNotas(ctx, circle.x, circle.y, circle.radius, circle.text);
            });
   
            desenharTeiaNota(ctx, notas, resultado.corTeia);
            desenharNomeRankingMedia(ctx, obj.nome.toLowerCase(), resultado.media, obj.ranking, obj.pontos)
            desenharPodioParticipacoes(ctx, obj.contests)
            desenharCirculoProfile(ctx, profimg);


            const buffer = canvas.toBuffer('image/png', { compressionLevel: 3, filters: canvas.PNG_FILTER_NONE })
            return interaction.createMessage({},
               {
               name: "imagem.png",
               file: buffer
               }
               )
});
         

      //return interaction.createMessage({embed: embed})
      })
   });
   };

   if(interaction.data.name == "overall"){
      const resultado = await getAllUsersMedia();
      const descCheck = resultado ? `Somando o overall de todos os nossos ${resultado.count} membros no time, a média é: **${resultado.mediaFinal}**` :
      "Não tem nenhum membro cadastrado";
      
      let embed = {
         description: `# Overall médio da Eternal Design\n
         ${descCheck}\n`,
         color: resultado.cor,
         footer: {
            text: `Atualizado em: ${dataFormatada()}`
         }
      }
      return interaction.createMessage({ embed: embed });
   };

   if(interaction.data.name == "add"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para usar o comando de adicionar um usuário ao banco de dados',
         flags: 64
      })

      let nome = interaction.data.options[0].value;
      let menção = interaction.data.options[1].value;
      let input = [nome, menção];
      let resultado = await addUser(nome, menção);
      if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, input, interaction.member);
      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   if(interaction.data.name == "remove"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para usar o comando de remover um usuário do banco de dados',
         flags: 64
      })

      let nome = interaction.data.options[0].value;
      let resultado = await removeUser(nome);
      if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, nome, interaction.member);

      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   if(interaction.data.name == "edit"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para editar as informações de um usuário do banco de dados',
         flags: 64
      });
      if(interaction.data.options.length < 2) return interaction.createMessage({
         content: 'Você precisa digitar ao menos uma informação para alterar',
         flags: 64
      });
      
      let nome = interaction.data.options[0].value;
      let categorias = ['pontos', 'ouro', 'prata', 'bronze', 'participações', 'preenchimento', 'color-correction', 'custom-text', 'paleta-de-cores', 'consistência', 'parte-técnica'];
      const notas = ['SS', 'S', 'S-', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];
      let input = [];
      
      // Encontrar o índice associado a 'preenchimento'
      const indicePreenchimento = categorias.indexOf('preenchimento');
      
      categorias.forEach((key, index) => {
          const foundUser = interaction.data.options.find(dado => {
              const dadoID = Object.values(dado);
              return dadoID && dadoID[2] && dadoID[2] === key;
          });
      
          // Se estamos a partir do elemento 'preenchimento' e foundUser é definido, converte para string apropriada
          if (index >= indicePreenchimento && foundUser) {
              const nota = notas.find(n => n === foundUser.value);
              input.push(nota || null);
          } else {
              // Adiciona o valor de foundUser ou null à array input
              input.push(foundUser !== undefined ? foundUser.value : null);
          }
      });

      let resultado = await editUser(nome, input);
      if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, input, interaction.member, nome);

      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   if(interaction.data.name == "profilelist"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para usar o comando de lista de perfis',
         flags: 64
      });
      const resultado = await getAllUsers();
      let embed = {
         description: `# Lista de membros da Eternal\n
         ${resultado.join('\n')}`,
         color: 14873597,
         footer: {
            text: `Atualizado em: ${dataFormatada()}`
         }
      }
      return interaction.createMessage({ embed: embed });
   };

   if(interaction.data.name == "grtop3"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para anunciar os ganhadores do contest gringo',
         flags: 64
      });

      let categorias = ['top1', 'top2', 'top3'];
      let pontuacao = [55, 40, 25, null];
      let input = [];
      
      categorias.forEach((mencao, index) => {
          const foundUser = interaction.data.options.find(dado => {
              const dadoID = Object.values(dado);
              return dadoID && dadoID[2] && dadoID[2] === mencao;
          });
          input.push(foundUser.value);
      });
      input.push(null);

      let resultado = await editUserSoma(input, pontuacao);
      if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, pontuacao, interaction.member, input)

      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   if(interaction.data.name == "brtop3"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para anunciar os ganhadores do contest gringo',
         flags: 64
      });

      let categorias = ['top1', 'top2', 'top3'];
      let pontuacao = [40, 25, 15, null];
      let input = [];
      
      categorias.forEach((mencao, index) => {
          const foundUser = interaction.data.options.find(dado => {
              const dadoID = Object.values(dado);
              return dadoID && dadoID[2] && dadoID[2] === mencao;
          });
          input.push(foundUser.value);
      });
      input.push(null);

      let resultado = await editUserSoma(input, pontuacao);
      if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, pontuacao, interaction.member, input)

      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   if(interaction.data.name == "cotop3"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para anunciar os ganhadores do contest gringo',
         flags: 64
      });

      let categorias = ['top1', 'top2', 'top3'];
      let pontuacao = [30, 20, 10, null];
      let input = [];
      
      categorias.forEach((mencao, index) => {
          const foundUser = interaction.data.options.find(dado => {
              const dadoID = Object.values(dado);
              return dadoID && dadoID[2] && dadoID[2] === mencao;
          });
          input.push(foundUser.value);
      });
      input.push(null);

      let resultado = await editUserSoma(input, pontuacao);
      if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, pontuacao, interaction.member, input)

      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   if(interaction.data.name == "resetpontuacoes"){
      if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({
         content: 'Você não tem permissão para usar esse comando (ainda bem)',
         flags: 64
      });
      if(!interaction.data.options[0].value || !interaction.data.options[1].value || !interaction.data.options[2].value) return interaction.createMessage({
         content: 'Ufa. O comando não foi executado.',
         flags: 64
      });

      let resultado = await resetAllUsers();
      logChannel(interaction.data.name, interaction.channel, undefined, interaction.member)
      return interaction.createMessage({
         content: resultado,
         flags: 64
      })
   };

   
   if(interaction.data.type === 3){ // Message Commands
      if(interaction.data.name == "Adicionar os pontos do Contest"){
         if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({content: 'Você não tem permissão para dar pontos', flags: 64});
         const channel = interaction.channel.id;
         const msg = interaction.data.target_id;

         client.getMessage(channel, msg).then(msg => {
            msg.getReaction('✅').then(async reactions => {
               if(reactions.find(user => user.id === client.user.id)) return interaction.createMessage({
                  content: 'Você já adicionou os pontos de participação para esse Contest',
                  flags: 64
                  });
                  let pontuacao = [null, null, null, 20];
                  let input = [null, null, null, msg.author.id];

                  let resultado = await editUserSoma(input, pontuacao);
                  interaction.createMessage({
                     content: resultado,
                     flags: 64
                  });
                  if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, pontuacao, interaction.member, input);

                  msg.addReaction('✅');
            });
         });
      }

      if(interaction.data.name == "Adicionar os pontos do Collab"){
         if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({content: 'Você não tem permissão para dar pontos', flags: 64});
         const channel = interaction.channel.id;
         const msg = interaction.data.target_id;

         client.getMessage(channel, msg).then(msg => {
            msg.getReaction('✅').then(async reactions => {
               if(reactions.find(user => user.id === client.user.id)) return interaction.createMessage({
                  content: 'Você já adicionou os pontos de participação para esse Collab',
                  flags: 64
                  });
                  let pontuacao = [null, null, null, 10];
                  let input = [null, null, null, msg.author.id];

                  let resultado = await editUserSoma(input, pontuacao);
                  interaction.createMessage({
                     content: resultado,
                     flags: 64
                  });
                  if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, pontuacao, interaction.member, input);

                  msg.addReaction('✅');
            });
         });
      }

      if(interaction.data.name == "Adicionar os pontos do Poster"){
         if(!vars.admins.includes(interaction.member.id)) return interaction.createMessage({content: 'Você não tem permissão para dar pontos', flags: 64});
         const channel = interaction.channel.id;
         const msg = interaction.data.target_id;

         client.getMessage(channel, msg).then(msg => {
            msg.getReaction('✅').then(async reactions => {
               if(reactions.find(user => user.id === client.user.id)) return interaction.createMessage({
                  content: 'Você já adicionou os pontos de participação para esse Poster',
                  flags: 64
                  });
                  let pontuacao = [null, null, null, 20];
                  let input = [null, null, null, msg.author.id];

                  let resultado = await editUserSoma(input, pontuacao);
                  interaction.createMessage({
                     content: resultado,
                     flags: 64
                  });
                  if(!resultado.startsWith('❌')) logChannel(interaction.data.name, interaction.channel, pontuacao, interaction.member, input);

                  msg.addReaction('✅');
            });
         });
      }
   }
})




client.on("messageCreate", async (msg) => {
   if(msg.author.bot) return;

   /*if(msg.content.startsWith("j!botão")){
      return msg.channel.createMessage({
         content: "Clica aí mano",
         components: [
            {
               type: 1,
               components: [
                  {
                  type: 2,
                  label: "Clica aqui", 
                  style: 1, 
                  custom_id: "botao"
                  }
               ]
            }
         ]
      })
   }*/
});

client.connect();  