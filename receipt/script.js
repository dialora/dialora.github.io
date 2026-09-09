const labels = {
  id: "Идентификатор записи",
  ofdId: "Оператор фискальных данных",
  receiveDate: "Дата получения ОФД",
  subtype: "Тип документа",
  address: "Адрес",
  content: "Содержание чека",
  messageFiscalSign: "Фискальный признак сообщения",
  code: "Код",
  fiscalDocumentFormatVer: "Версия формата ФД",
  fiscalDriveNumber: "Номер фискального накопителя",
  kktRegId: "Регистрационный номер ККТ",
  userInn: "ИНН продавца",
  fiscalDocumentNumber: "Номер фискального документа",
  dateTime: "Дата и время документа",
  fiscalSign: "Фискальный признак",
  shiftNumber: "Номер смены",
  requestNumber: "Номер чека",
  operationType: "Тип операции",
  totalSum: "Итоговая сумма",
  internetSign: "Признак интернет-расчета",
  items: "Позиции чека",
  name: "Наименование",
  price: "Цена",
  quantity: "Количество",
  itemsQuantityMeasure: "Единица измерения",
  sum: "Сумма",
  nds: "НДС",
  ndsSum: "Сумма НДС",
  paymentType: "Способ расчета",
  productType: "Тип продукта",
  providerInn: "ИНН поставщика",
  providerData: "Данные поставщика",
  providerPhone: "Телефон поставщика",
  providerName: "Наименование поставщика",
  paymentAgentByProductType: "Признак агента по предмету расчета",
  productCodeNew: "Код маркировки",
  gs1m: "GS1M",
  rawProductCode: "Исходный код товара",
  productIdType: "Номер типа продукта",
  gtin: "GTIN",
  sernum: "Серийный номер",
  itemsIndustryDetails: "Отраслевые реквизиты",
  idFoiv: "Код ФОИВ",
  foundationDocDateTime: "Дата основания",
  foundationDocNumber: "Номер основания",
  industryPropValue: "Значение отраслевого реквизита",
  labelCodeProcesMode: "Режим обработки кода маркировки",
  checkingProdInformationResult: "Результат проверки сведений о товаре",
  buyerPhoneOrAddress: "Телефон или адрес покупателя",
  sellerAddress: "Адрес продавца в сети",
  machineNumber: "Номер автомата",
  cashTotalSum: "Наличными",
  ecashTotalSum: "Безналичными",
  prepaidSum: "Предоплата",
  creditSum: "Постоплата / кредит",
  provisionSum: "Встречное предоставление",
  fnsUrl: "Сайт ФНС",
  retailPlace: "Место расчетов",
  nds10: "Сумма НДС 10%",
  amountsReceiptNds: "Суммы НДС по чеку",
  amountsNds: "НДС по ставкам",
  user: "Продавец",
  retailPlaceAddress: "Адрес места расчетов",
  appliedTaxationType: "Система налогообложения",
  internetPayment: "Признак оплаты в интернете",
  checkingLabeledProdResult: "Результат проверки маркированного товара",
  region: "Регион",
  numberKkt: "Заводской номер ККТ",
  redefine_mask: "Служебный признак"
};

const moneyKeys = new Set([
  "price", "sum", "ndsSum", "totalSum", "cashTotalSum", "ecashTotalSum",
  "prepaidSum", "creditSum", "provisionSum", "nds10"
]);

const topValueKeys = new Set([
  "address", "retailPlaceAddress", "industryPropValue", "rawProductCode",
  "productCodeNew", "itemsIndustryDetails", "providerData", "amountsReceiptNds"
]);

const hiddenItemMainKeys = new Set(["name", "price", "quantity", "sum", "nds", "ndsSum"]);

const itemMainFields = [
  { key: "_index", label: "№", units: 1 },
  { key: "name", units: 3 },
  { key: "price", units: 1 },
  { key: "quantity", label: "Кол-во", units: 1 },
  { key: "sum", units: 1 },
  { key: "nds", units: 1 },
  { key: "ndsSum", label: "НДС, сумма", units: 2 }
];

const packedTopPaths = [
  "id", "ofdId", "receiveDate", "subtype", "address",
  "content.messageFiscalSign", "content.code", "content.fiscalDocumentFormatVer",
  "content.fiscalDriveNumber", "content.kktRegId", "content.userInn",
  "content.fiscalDocumentNumber", "content.dateTime", "content.fiscalSign",
  "content.shiftNumber", "content.requestNumber", "content.operationType",
  "content.totalSum", "content.internetSign"
];

const PACK_COLUMNS = 10;

// Состояние приложения
let currentJsonData = null;
let isJsonView = false;

const statusEl = document.getElementById("status");
const contentEl = document.getElementById("content");
const jsonMenu = document.getElementById("jsonMenu");
const menuButtons = jsonMenu.querySelectorAll("button");
const paperEl = document.getElementById("paper");
const jsonTreeEl = document.getElementById("jsonTree");
const toggleViewButton = document.getElementById("toggleViewButton");

document.getElementById("printButton").addEventListener("click", () => window.print());

// Переключение вида Чек / JSON
toggleViewButton.addEventListener("click", () => {
  isJsonView = !isJsonView;
  
  if (isJsonView) {
    toggleViewButton.textContent = "Вид: Чек";
    paperEl.classList.add("hidden");
    jsonTreeEl.classList.remove("hidden");
    
    if (currentJsonData) {
      jsonTreeEl.textContent = JSON.stringify(currentJsonData, null, 2);
    }
  } else {
    toggleViewButton.textContent = "Вид: JSON";
    jsonTreeEl.classList.add("hidden");
    paperEl.classList.remove("hidden");
  }
});

function loadJsonFile(fileName, activeButtonElement) {
  menuButtons.forEach(btn => btn.classList.remove('active'));
  if (activeButtonElement) {
    activeButtonElement.classList.add('active');
  }

  statusEl.textContent = `Загрузка файла ${fileName}...`;
  contentEl.innerHTML = ""; 
  
  fetch(`./json/${fileName}`, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error("Файл не найден");
      return response.text();
    })
    .then((text) => renderText(text, fileName))
    .catch((error) => {
      statusEl.textContent = "Ошибка загрузки";
      contentEl.innerHTML = `<div class="notice">Не удалось загрузить файл ${fileName} по пути /receipt/json/. Убедитесь, что файл существует на GitHub Pages.</div>`;
    });
}

menuButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    const fileName = e.target.getAttribute("data-file");
    loadJsonFile(fileName, e.target);
  });
});

if (menuButtons.length > 0) {
  const firstBtn = menuButtons[0];
  loadJsonFile(firstBtn.getAttribute("data-file"), firstBtn);
}

function renderText(text, sourceName) {
  try {
    const data = JSON.parse(text);
    const fixed = deepFixText(data);
    
    currentJsonData = fixed; // Сохраняем для дерева

    renderReceipt(fixed);

    // Если сейчас открыт режим JSON, сразу обновляем его текст
    if (isJsonView) {
      jsonTreeEl.textContent = JSON.stringify(currentJsonData, null, 2);
    }

    statusEl.textContent = `Успешно загружен: ${sourceName}`;
  } catch (error) {
    statusEl.textContent = `Ошибка чтения: ${error.message}`;
    contentEl.innerHTML = `<div class="notice">Файл ${sourceName} не удалось разобрать как JSON. Проверьте валидность файла.</div>`;
  }
}

function renderReceipt(data) {
  contentEl.textContent = "";
  addSection("Верхние реквизиты", renderPackedTopTable(data));
  addSection("Полная вложенная таблица исходного массива", renderValue(withoutTopPackedFields(data), ""));
}

function addSection(title, node) {
  const sectionTitle = document.createElement("div");
  sectionTitle.className = "section-title";
  sectionTitle.textContent = title;
  contentEl.append(sectionTitle, node);
}

function renderItemsTable(items) {
  const list = document.createElement("div");
  list.className = "items-list";

  items.forEach((item, index) => {
    const block = document.createElement("div");
    block.className = "item-block";

    const title = document.createElement("div");
    title.className = "item-title";
    title.textContent = `Позиция чека ${index + 1}`;

    const mainFields = itemMainFields.map((field) => {
      const key = field.key;
      const itemKey = key === "_index" ? key : key;
      const value = key === "_index" ? index + 1 : item[key];
      return {
        key: itemKey,
        label: field.label || labelFor(key),
        value: formatValue(value, key),
        units: field.units
      };
    });

    const rest = omitKeys(item, [...hiddenItemMainKeys]);
    const extraFields = Object.entries(rest).map(([key, value]) => {
      const complex = isComplex(value);
      const displayValue = complex ? "" : formatValue(value, key);
      return {
        key,
        label: labelFor(key),
        value: displayValue,
        valueNode: complex ? renderValue(value, `content.items.${index}.${key}`) : null,
        units: complex ? 10 : estimateTileUnits(labelFor(key), displayValue)
      };
    });

    block.append(title, renderPackedFields([mainFields], "item-main"));
    if (extraFields.length > 0) {
      const extra = document.createElement("div");
      extra.className = "item-extra";
      extra.append(renderPackedFields(packFields(extraFields.sort((left, right) => right.units - left.units), PACK_COLUMNS)));
      block.append(extra);
    }
    list.append(block);
  });

  return list;
}

function renderValue(value, path) {
  if (Array.isArray(value)) return renderArray(value, path);
  if (value && typeof value === "object") return renderObject(value, path);
  const span = document.createElement("span");
  span.textContent = formatValue(value, lastPathPart(path));
  return span;
}

function renderObject(object, path) {
  const table = document.createElement("table");
  const tbody = document.createElement("tbody");

  Object.entries(object).forEach(([key, value]) => {
    const childPath = path ? `${path}.${key}` : key;
    const tr = document.createElement("tr");

    if (key === "items" && Array.isArray(value)) {
      const td = document.createElement("td");
      td.colSpan = 2;
      const keyDiv = document.createElement("div");
      keyDiv.className = "stack-key";
      keyDiv.textContent = labelFor(key);
      const valueDiv = document.createElement("div");
      valueDiv.className = "stack-value";
      valueDiv.append(renderItemsTable(value));
      td.append(keyDiv, valueDiv);
      tr.append(td);
    } else if (topValueKeys.has(key) || isComplex(value)) {
      const td = document.createElement("td");
      td.colSpan = 2;
      const keyDiv = document.createElement("div");
      keyDiv.className = "stack-key";
      keyDiv.textContent = labelFor(key);
      const valueDiv = document.createElement("div");
      valueDiv.className = "stack-value";
      valueDiv.append(renderValue(value, childPath));
      td.append(keyDiv, valueDiv);
      tr.append(td);
    } else {
      const keyTd = document.createElement("td");
      keyTd.className = "kv-key";
      keyTd.textContent = labelFor(key);
      const valueTd = document.createElement("td");
      valueTd.className = "kv-value";
      valueTd.textContent = formatValue(value, key);
      tr.append(keyTd, valueTd);
    }

    tbody.append(tr);
  });

  table.append(tbody);
  return table;
}

function renderPackedTopTable(data) {
  const fields = packedTopPaths
    .map((path) => {
      const key = lastPathPart(path);
      const value = getPath(data, path);
      if (value === undefined) return null;
      const label = labelFor(key);
      const displayValue = formatValue(value, key);
      return {
        path,
        key,
        label,
        value: displayValue,
        units: estimateTileUnits(label, displayValue)
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.units - left.units);

  const rows = packFields(fields, PACK_COLUMNS);
  return renderPackedFields(rows);
}

function renderPackedFields(rows, extraClass = "") {
  const table = document.createElement("table");
  table.className = extraClass ? `packed ${extraClass}` : "packed";
  const tbody = document.createElement("tbody");

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    let used = 0;
    row.forEach((field) => {
      const td = document.createElement("td");
      td.colSpan = field.units;
      td.append(renderTile(field));
      tr.append(td);
      used += field.units;
    });
    if (used < PACK_COLUMNS) {
      const pad = document.createElement("td");
      pad.className = "tile-pad";
      pad.colSpan = PACK_COLUMNS - used;
      tr.append(pad);
    }
    tbody.append(tr);
  });

  table.append(tbody);
  return table;
}

function renderTile(field) {
  const tile = document.createElement("div");
  tile.className = "tile";
  const key = document.createElement("div");
  key.className = "tile-key";
  key.append(createLabelWithBreaks(field.label));
  const value = document.createElement("div");
  value.className = "tile-value";
  if (field.valueNode) {
    value.append(field.valueNode);
  } else {
    value.textContent = field.value;
  }
  tile.append(key, value);
  return tile;
}

function createLabelWithBreaks(label) {
  const fragment = document.createDocumentFragment();
  const text = String(label);
  const parts = text.split(/(\(|\)|[a-zа-яё])(?=[A-ZА-ЯЁ])/g).filter((part) => part !== "");
  parts.forEach((part, index) => {
    fragment.append(document.createTextNode(part));
    if (index < parts.length - 1 || part === "(") fragment.append(document.createElement("wbr"));
  });
  return fragment;
}

function estimateTileUnits(label, value) {
  const labelWeight = estimateWrappedTextWidth(label);
  const valueWeight = estimateWrappedTextWidth(String(value)) * 0.9;
  const needed = Math.max(labelWeight, valueWeight);
  if (needed <= 8) return 1;
  if (needed <= 16) return 2;
  if (needed <= 25) return 3;
  if (needed <= 36) return 4;
  if (needed <= 50) return 5;
  if (needed <= 66) return 6;
  if (needed <= 84) return 8;
  return 10;
}

function estimateWrappedTextWidth(text) {
  const normalized = String(text)
    .replace(/([a-zа-яё])(?=[A-ZА-ЯЁ])/g, "$1 ")
    .replace(/\(/g, " (")
    .replace(/\)/g, ") ")
    .replace(/\s+/g, " ")
    .trim();
  const parts = normalized.split(" ").filter(Boolean);
  const longestPart = parts.reduce((max, part) => Math.max(max, part.length), 0);
  const lineCountHint = Math.ceil(normalized.length / Math.max(longestPart + 4, 14));
  return longestPart + Math.max(0, lineCountHint - 2) * 1.25;
}

function packFields(fields, width) {
  const rows = [];
  fields.forEach((field) => {
    let targetRow = null;
    let targetFree = Infinity;
    rows.forEach((row) => {
      const used = row.reduce((sum, item) => sum + item.units, 0);
      const free = width - used;
      if (field.units <= free && free < targetFree) {
        targetRow = row;
        targetFree = free;
      }
    });
    if (!targetRow) {
      targetRow = [];
      rows.push(targetRow);
    }
    targetRow.push(field);
  });
  return rows;
}

function withoutTopPackedFields(data) {
  const copy = structuredClone(data);
  packedTopPaths.forEach((path) => deletePath(copy, path));
  return pruneEmptyObjects(copy);
}

function deletePath(object, path) {
  const parts = path.split(".");
  const key = parts.pop();
  const parent = parts.reduce((current, part) => current?.[part], object);
  if (parent && Object.prototype.hasOwnProperty.call(parent, key)) delete parent[key];
}

function pruneEmptyObjects(value) {
  if (Array.isArray(value)) return value.map(pruneEmptyObjects);
  if (!value || typeof value !== "object") return value;
  Object.keys(value).forEach((key) => {
    value[key] = pruneEmptyObjects(value[key]);
    if (
      value[key] &&
      typeof value[key] === "object" &&
      !Array.isArray(value[key]) &&
      Object.keys(value[key]).length === 0
    ) {
      delete value[key];
    }
  });
  return value;
}

function renderArray(array, path) {
  const wrapper = document.createElement("div");
  array.forEach((item, index) => {
    const group = document.createElement("div");
    group.className = "group";
    const title = document.createElement("div");
    title.className = "group-title";
    title.textContent = `${labelFor(lastPathPart(path))}: ${index + 1}`;
    group.append(title, renderValue(item, `${path}.${index}`));
    wrapper.append(group);
  });
  return wrapper;
}

function pick(data, spec) {
  return spec
    .map(([path, fallbackLabel]) => {
      const value = getPath(data, path);
      return { key: lastPathPart(path), label: fallbackLabel, value };
    })
    .filter((row) => row.value !== undefined);
}

function getPath(object, path) {
  return path.split(".").reduce((current, part) => current?.[part], object);
}

function omitKeys(object, keys) {
  const blocked = new Set(keys);
  return Object.fromEntries(Object.entries(object).filter(([key]) => !blocked.has(key)));
}

function labelFor(key) {
  return labels[key] ? `${labels[key]} (${key})` : key;
}

function lastPathPart(path) {
  return String(path || "").split(".").pop();
}

function isComplex(value) {
  return value && typeof value === "object";
}

function formatValue(value, key) {
  if (value == null) return "";
  if (moneyKeys.has(key) && typeof value === "number") return formatMoney(value);
  if ((key === "dateTime" || key === "receiveDate") && value) return formatDate(value);
  return String(value);
}

function formatMoney(value) {
  if (typeof value !== "number") return value ?? "";
  return `${(value / 100).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} руб.`;
}

function formatDate(value) {
  const date = typeof value === "number" ? new Date(value * 1000) : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ru-RU");
}

function deepFixText(value) {
  if (Array.isArray(value)) return value.map(deepFixText);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, deepFixText(child)]));
  }
  if (typeof value === "string") return fixMojibake(value);
  return value;
}

const cp1251Decoder = new TextDecoder("windows-1251");
const utf8Decoder = new TextDecoder("utf-8", { fatal: false });
const cp1251Lookup = new Map();
for (let byte = 0; byte <= 255; byte += 1) {
  cp1251Lookup.set(cp1251Decoder.decode(new Uint8Array([byte])), byte);
}

function fixMojibake(text) {
  if (!/[РС][\u0400-\u04ff\u2039\u203a]/.test(text)) return text;
  const bytes = [];
  for (const char of text) {
    const byte = cp1251Lookup.get(char);
    if (byte == null) return text;
    bytes.push(byte);
  }
  const fixed = utf8Decoder.decode(new Uint8Array(bytes));
  return scoreReadable(fixed) > scoreReadable(text) ? fixed : text;
}

function scoreReadable(text) {
  const cyrillic = (text.match(/[А-Яа-яЁё]/g) || []).length;
  const mojibake = (text.match(/[РС][\u0400-\u04ff\u2039\u203a]/g) || []).length;
  return cyrillic - mojibake * 4;
}
