var apiKey = 'Insira_a_sua_Api_Key';
var email = 'Insira_seu_email'

function eventosDeHoje() {
  var hoje = new Date();
  var inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  var fimDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);

  var eventos = CalendarApp.getEvents(inicioDoDia, fimDoDia);

  //Logger.log('Eventos de Hoje:');
  for (var i = 0; i < eventos.length; i++) {
    var evento = eventos[i];

    if (evento.getDescription() && evento.getDescription().startsWith("##")) {
      //Logger.log('Descrição: ' + evento.getTitle());

      var descricao = evento.getDescription();
      var linhas = descricao.split('\n');

      // Extrair o título do projeto
      var tituloProjeto = linhas[0].substring(2).trim();

      var startTimeFormatted = Utilities.formatDate(evento.getStartTime(), 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
      var endTimeFormatted = Utilities.formatDate(evento.getEndTime(), 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");

      var idDoProjeto = obterIdDoProjeto(tituloProjeto.replace(" ","%20"), evento.getTitle())

      // Extrair as tags
      var tags = [];
      for (var j = 1; j < linhas.length; j++) {
        var tag = linhas[j].substring(1).trim();
        if (tag != "backoffice")
          tags.push(obterIdDaTag(tag, evento.getTitle()));
        else
          timeEntry(evento.getTitle()+" - Backoffice", startTimeFormatted, endTimeFormatted, idDoProjeto)
      }

      if (tags.length > 0)
        timeEntry(evento.getTitle(), startTimeFormatted, endTimeFormatted, idDoProjeto, tags)
    }
  }

}

function obterIdDoProjeto(nomeCurto, evento) {
  var url = 'https://api.clockify.me/api/v1/workspaces/6531864060720f76a4e5f7b1/projects?name='+nomeCurto;

  var options = {
    'method': 'get',
    'headers': {
      'x-api-key': apiKey
    }
  };

  var resposta = UrlFetchApp.fetch(url, options);
  var projetos = JSON.parse(resposta.getContentText());

  if (projetos.length == 1){
    projeto = projetos[0];
    return projeto.id
  } else if (projetos.length == 0){
    enviarEmail("nenhumProjeto", nomeCurto, evento)
  } else {
    enviarEmail("muitosProjetos",nomeCurto, evento)
  } 
}

function obterIdDaTag (tag, evento){
  var url = 'https://api.clockify.me/api/v1/workspaces/6531864060720f76a4e5f7b1/tags?name='+tag;

  var options = {
    'method': 'get',
    'headers': {
      'x-api-key': apiKey
    }
  };

  var resposta = UrlFetchApp.fetch(url, options);
  var tags = JSON.parse(resposta.getContentText());

  if (tags.length == 1){
    tag = tags[0];
    return tag.id
  } else if (tags.length == 0){
    enviarEmail("nenhumaTag",tag, evento)
  } else {
    enviarEmail("muitasTags",tag, evento)
  } 
}

function timeEntry (descricao, start, end, projectId, tags){
  const url = 'https://api.clockify.me/api/v1/workspaces/6531864060720f76a4e5f7b1/time-entries';

  const data = {
    billable: true,
    description: descricao,
    start: start,
    end: end,
    projectId: projectId,
    tagIds: tags,
  };

  //Logger.log(data)
  const options = {
    method: 'post',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    payload: JSON.stringify(data),
  };

  UrlFetchApp.fetch(url, options);
}

function enviarEmail(tipo, conteudo, evento) {
  var destinatario = email;
  var assunto = 'Automação do Clockify';

  if (tipo == "nenhumProjeto"){
    var mensagem = 'O projeto "' + conteudo + '" não foi encontrado.';
  } else if (tipo == "muitosProjetos"){
    var mensagem = 'Muitos projetos encontrados com o nome "' + conteudo + '".';
  } else if (tipo == "nenhumaTag"){
    var mensagem = 'A tag "' + conteudo + '" não foi encontrada.';
  } else if (tipo == "muitasTags"){
    var mensagem = 'Muitas tags encontradas com o nome "' + conteudo + '".';
  }

  mensagem = mensagem + " Agenda: " + evento + "."

  // Envia o e-mail
  MailApp.sendEmail({
    to: destinatario,
    subject: assunto,
    body: mensagem,
  });
}