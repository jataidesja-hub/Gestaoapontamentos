/**
 * Backend para Gestão de Frotas e Equipamentos
 * Este script deve ser colado em um "Google Apps Script" vinculado à planilha.
 * Publique como Web App (Acesso: Qualquer pessoa, inclusive anônima se desejar facilidade).
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getEquipments') {
    return getJsonData('Equipamentos');
  } else if (action === 'getEntries') {
    return getJsonData('Lancamentos');
  }
  
  return jsonResponse({ error: 'Action not found' });
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'addEquipment') {
    return addData('Equipamentos', [
      generateId(), 
      data.nome, 
      data.placa, 
      data.tipo, 
      data.categoria, 
      data.valorMensal
    ]);
  } else if (action === 'addEntry') {
    return addData('Lancamentos', [
      data.data, 
      data.idEquipamento, 
      data.valorInicial, 
      data.valorFinal, 
      data.status
    ]);
  }
  
  return jsonResponse({ error: 'Action not found' });
}

function getJsonData(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return jsonResponse([]);
  
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  
  const result = data.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header.toLowerCase().replace(/ /g, '_')] = row[i];
    });
    return obj;
  });
  
  return jsonResponse(result);
}

function addData(sheetName, rowData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    // Tenta criar se não existir (Opcional)
    return jsonResponse({ error: `Sheet ${sheetName} not found` });
  }
  sheet.appendRow(rowData);
  return jsonResponse({ success: true });
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateId() {
  return Utilities.getUuid();
}

/**
 * Função para configurar as abas da planilha se necessário
 */
function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss.getSheetByName('Equipamentos')) {
    const sheet = ss.insertSheet('Equipamentos');
    sheet.appendRow(['id', 'nome', 'placa', 'tipo', 'categoria', 'valor_mensal']);
  }
  
  if (!ss.getSheetByName('Lancamentos')) {
    const sheet = ss.insertSheet('Lancamentos');
    sheet.appendRow(['data', 'id_equipamento', 'valor_inicial', 'valor_final', 'status']);
  }
}
