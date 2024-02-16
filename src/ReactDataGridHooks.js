import { useHttpClient } from "./HttpHooks";

/**
 * * Mapa de operadores React Data Grid - Laravel Orion
 * @var {Object}
 */
const operatorsMap = {
  contains: "like",
  notContains: "not like",
  eq: "=",
  neq: "!=",
  empty: "=",
  notEmpty: "!=",
  startsWith: "like",
  endsWith: "like",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

/**
 * * Procesa los filtros de React Data Grid para convertirlos en filtros válidos para Laravel Orion
 * @param {Array} filters=[]
 * @returns {Array}
 */
const processFilters = (filters = []) => {
  /**
   * * Procesa el valor de un filtro en base al tipo y el operador
   * @param {any} value
   * @param {String} type
   * @param {String} operator
   * @returns {any}
   */
  const processValue = (value, type, operator) => {
    let processedValue = "";
    switch (operator) {
      case "contains":
      case "notContains":
        processedValue = `%${value}%`;
        break;
      case "empty":
      case "notEmpty":
        processedValue = "";
        break;
      case "startsWith":
        processedValue = `${value}%`;
        break;
      case "endsWith":
        processedValue = `%${value}`;
        break;
      default:
        processedValue = value;
        break;
    }
    switch (type) {
      case "string":
      case "select":
      case "date":
        return String(processedValue);
      case "number":
      case "boolean":
        return Number(processedValue);
      default:
        return processedValue;
    }
  };

  /**
   * * Valida un filtro en base a su valor y su operador
   * @param {any} filter
   * @returns {any}
   */
  const validateFilter = (filter) => {
    const { value, operator } = filter;
    if (value === null) return false;
    if (value === "" && operator !== "empty" && operator !== "notEmpty")
      return false;
    return true;
  };

  /**
   * * Construye el objeto de un filtro
   * @param {any} filter
   * @returns {any}
   */
  const buildFilter = (filter) => {
    const { name, operator: op, type, value: val } = filter;
    const built = [];
    if (op === "inrange") {
      if (val.start !== null && val.end !== null) {
        built.push({
          field: name,
          operator: operatorsMap.gte,
          value: processValue(val.start, type, op),
        });
        built.push({
          field: name,
          operator: operatorsMap.lte,
          value: processValue(val.end, type, op),
        });
      }
    } else if (op === "notinrange") {
      if (val.start !== null && val.end !== null) {
        built.push({
          field: name,
          operator: operatorsMap.lt,
          type: "or",
          value: processValue(val.start, type, op),
        });
        built.push({
          field: name,
          operator: operatorsMap.gt,
          type: "or",
          value: processValue(val.end, type, op),
        });
      }
    } else {
      built.push({
        field: name,
        operator: operatorsMap[op],
        value: processValue(val, type, op),
      });
    }
    return built;
  };

  if (filters) {
    const processedFilters = filters
      .filter(validateFilter)
      .flatMap(buildFilter); // validación y construcción
    return processedFilters;
  } else {
    return [];
  }
};

export function useRemoteData(url, extraParams = {}, beforeFilter = undefined) {
  const { request } = useHttpClient();
  /**
   * * Función para la carga de datos para React Data Grid
   * * Realiza solicitudes a endpoints construidos con Laravel Orion
   * @param {any} {skip=0
   * @param {any} limit=0
   * @param {any} sortInfo
   * @param {any} filterValue}
   * @returns {Promise}
   */
  const loadData = async ({ skip = 0, limit = 0, sortInfo, filterValue }) => {
    let filters
    if (typeof beforeFilter === 'function') {
      filters = beforeFilter(processFilters(filterValue))
    } else {
      filters = processFilters(filterValue)
    }
    const appliedFilters = filters.length; // Identifica cuántos filtros debe aplicarse
    const page = parseInt(skip / limit) + 1; // Obtiene el límite de registros por página

    const urlParams = new URLSearchParams();

    for (const key in extraParams) {
      urlParams.append(key, extraParams[key]);
    }

    if (limit !== 0) {
      urlParams.append("limit", limit);
    }

    if (skip !== 0) {
      urlParams.append("page", page);
    }

    const params = urlParams.toString();

    // Si hay filtros solicita a un endpoint de búsqueda
    const searchUrlExcerpt = appliedFilters > 0 ? "/search" : "";

    const requestConfig = {
      url: `${url}${searchUrlExcerpt}${params !== "" ? `?${params}` : ""}`,
      method: appliedFilters > 0 ? "POST" : "GET",
    };

    if (appliedFilters > 0) {
      // Si hay filtros añade datos de búsqueda
      requestConfig.data = {
        filters,
      };
    }

    const response = await request(requestConfig);

    const { data, meta } = response;

    return Promise.resolve({
      data,
      count: parseInt(meta.total),
    });
  };

  return { loadData };
}
