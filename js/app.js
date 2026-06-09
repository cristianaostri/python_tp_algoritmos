/* =============================================
   MEDICONTROL — Logica de la aplicacion
   app.js
   ============================================= */

/* =============================================
   DATOS (localStorage)
   ============================================= */

var meds = [];
var hist = [];

try { meds = JSON.parse(localStorage.getItem('mc-meds') || '[]'); } catch (e) {}
try { hist = JSON.parse(localStorage.getItem('mc-hist') || '[]'); } catch (e) {}

function guardar() {
  try {
    localStorage.setItem('mc-meds', JSON.stringify(meds));
    localStorage.setItem('mc-hist', JSON.stringify(hist));
  } catch (e) {}
}

/* =============================================
   UTILIDADES
   ============================================= */

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function diasHasta(fecha) {
  if (!fecha) return 9999;
  return Math.round((new Date(fecha) - new Date()) / 864e5);
}

function colorStock(pct) {
  if (pct > 40) return '#1D9E75';
  if (pct > 15) return '#EF9F27';
  return '#E24B4A';
}

/* =============================================
   TOAST (notificaciones)
   ============================================= */

function toast(msg, esError) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast' + (esError ? ' error' : '');
  setTimeout(function () { t.classList.add('show'); }, 10);
  setTimeout(function () { t.classList.remove('show'); }, 2800);
}

/* =============================================
   NAVEGACION
   ============================================= */

function ir(id, btn) {
  document.querySelectorAll('.section').forEach(function (s) {
    s.classList.remove('active');
  });
  document.querySelectorAll('.nav-btn').forEach(function (b) {
    b.classList.remove('active');
  });

  document.getElementById('s-' + id).classList.add('active');
  btn.classList.add('active');

  if (id === 'inicio')  renderInicio();
  if (id === 'lista')   renderLista('');
  if (id === 'toma')    renderToma();
  if (id === 'alertas') renderAlertas();
  if (id === 'dias')    renderDias();
}

/* =============================================
   SECCION: INICIO (dashboard)
   ============================================= */

function renderInicio() {
  var alertasN = meds.filter(function (m) {
    var d = diasHasta(m.vencimiento);
    return m.stockActual < 5 || (d < 30 && d >= 0) || d < 0;
  }).length;

  var tomasHoy = hist.filter(function (h) {
    return h.fecha === hoy();
  }).length;

  /* Metricas */
  document.getElementById('metricas').innerHTML =
    '<div class="metrica">' +
      '<div class="metrica-num">' + meds.length + '</div>' +
      '<div class="metrica-lbl">Medicamentos</div>' +
    '</div>' +
    '<div class="metrica">' +
      '<div class="metrica-num" style="color:' + (alertasN > 0 ? '#A32D2D' : '#0F6E56') + '">' + alertasN + '</div>' +
      '<div class="metrica-lbl">Alertas</div>' +
    '</div>' +
    '<div class="metrica">' +
      '<div class="metrica-num">' + tomasHoy + '</div>' +
      '<div class="metrica-lbl">Tomas hoy</div>' +
    '</div>';

  /* Alertas del dia */
  var als = [];
  meds.forEach(function (m) {
    if (m.stockActual < 5) {
      als.push(
        '<div class="alerta alerta-stock">' +
          '<i class="ti ti-alert-triangle"></i>' +
          '<div>' +
            '<div class="alerta-titulo">' + m.nombre + ' - Stock bajo</div>' +
            '<div class="alerta-detalle">Quedan solo ' + m.stockActual + ' unidades. Compra mas pronto.</div>' +
          '</div>' +
        '</div>'
      );
    }
    var d = diasHasta(m.vencimiento);
    if (d < 0) {
      als.push(
        '<div class="alerta alerta-venc">' +
          '<i class="ti ti-x"></i>' +
          '<div>' +
            '<div class="alerta-titulo">' + m.nombre + ' - Vencido</div>' +
            '<div class="alerta-detalle">Este medicamento ya vencio. No lo uses.</div>' +
          '</div>' +
        '</div>'
      );
    } else if (d < 30) {
      als.push(
        '<div class="alerta alerta-stock">' +
          '<i class="ti ti-clock"></i>' +
          '<div>' +
            '<div class="alerta-titulo">' + m.nombre + ' - Proximo a vencer</div>' +
            '<div class="alerta-detalle">Vence en ' + d + ' dias (' + m.vencimiento + ').</div>' +
          '</div>' +
        '</div>'
      );
    }
  });

  if (!als.length) {
    als.push(
      '<div class="alerta alerta-ok">' +
        '<i class="ti ti-circle-check"></i>' +
        '<div>' +
          '<div class="alerta-titulo">Todo en orden</div>' +
          '<div class="alerta-detalle">No hay alertas en este momento.</div>' +
        '</div>' +
      '</div>'
    );
  }
  document.getElementById('inicio-alertas').innerHTML = als.join('');

  /* Ultimas tomas */
  var ultimas = hist.slice(0, 5).map(function (h) {
    return (
      '<div class="historial-item">' +
        '<i class="ti ti-circle-check"></i>' +
        '<div>' +
          '<strong>' + h.med + '</strong> - ' + h.dosis + ' unidad' + (h.dosis > 1 ? 'es' : '') + '<br>' +
          '<span style="font-size:14px;color:var(--texto-sec)">' + h.fecha + ' a las ' + h.hora + '</span>' +
        '</div>' +
      '</div>'
    );
  });

  document.getElementById('inicio-historial').innerHTML = ultimas.length
    ? ultimas.join('')
    : '<div class="empty"><i class="ti ti-history"></i>Todavia no registraste ninguna toma.</div>';
}

/* =============================================
   SECCION: AGREGAR MEDICAMENTO
   ============================================= */

function agregar() {
  var nombre     = document.getElementById('f-nombre').value.trim();
  var doctor     = document.getElementById('f-doctor').value.trim();
  var categoria  = document.getElementById('f-categoria').value;
  var dosis      = parseInt(document.getElementById('f-dosis').value) || 1;
  var frecuencia = parseInt(document.getElementById('f-frecuencia').value) || 1;
  var stock      = parseInt(document.getElementById('f-stock').value);
  var inicio     = document.getElementById('f-inicio').value;
  var termino    = document.getElementById('f-termino').value;
  var vencimiento = document.getElementById('f-vencimiento').value;

  /* Validaciones */
  if (!nombre)              { toast('Por favor escribi el nombre del medicamento', true); return; }
  if (!doctor)              { toast('Por favor escribi el nombre del doctor', true); return; }
  if (isNaN(stock) || stock < 0) { toast('El stock debe ser un numero mayor o igual a cero', true); return; }
  if (!vencimiento)         { toast('Por favor ingresa la fecha de vencimiento', true); return; }

  var duplicado = meds.find(function (m) {
    return m.nombre.toLowerCase() === nombre.toLowerCase();
  });
  if (duplicado) { toast('Ese medicamento ya esta en la lista', true); return; }

  /* Guardar */
  meds.push({
    nombre:       nombre,
    doctor:       doctor,
    categoria:    categoria,
    dosis:        dosis,
    frecuencia:   frecuencia,
    stockInicial: stock,
    stockActual:  stock,
    inicio:       inicio,
    termino:      termino,
    vencimiento:  vencimiento
  });

  guardar();
  toast('Guardado: ' + nombre);

  /* Limpiar formulario */
  ['f-nombre', 'f-doctor', 'f-inicio', 'f-termino', 'f-vencimiento'].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('f-dosis').value     = 1;
  document.getElementById('f-frecuencia').value = 1;
  document.getElementById('f-stock').value      = 30;
  document.getElementById('f-categoria').value  = '';
}

/* =============================================
   SECCION: LISTA DE MEDICAMENTOS
   ============================================= */

function renderLista(filtro) {
  var encontrados = meds.filter(function (m) {
    return m.nombre.toLowerCase().includes(filtro.toLowerCase());
  });

  if (!encontrados.length) {
    document.getElementById('lista-contenido').innerHTML =
      '<div class="empty"><i class="ti ti-pill"></i>No hay medicamentos registrados todavia.</div>';
    return;
  }

  document.getElementById('lista-contenido').innerHTML = encontrados.map(function (m) {
    var pct = m.stockInicial > 0 ? Math.round(m.stockActual / m.stockInicial * 100) : 0;
    var d   = diasHasta(m.vencimiento);
    var idx = meds.indexOf(m);

    var estadoVencimiento =
      d < 0
        ? '<span style="font-size:14px;background:var(--rojo-claro);color:var(--rojo);padding:3px 10px;border-radius:8px;font-weight:600">Vencido</span>'
        : d < 30
          ? '<span style="font-size:14px;background:var(--naranja-claro);color:var(--naranja);padding:3px 10px;border-radius:8px;font-weight:600">Vence en ' + d + ' dias</span>'
          : '<span style="font-size:14px;background:var(--verde-claro);color:#0F6E56;padding:3px 10px;border-radius:8px;font-weight:600">Vigente</span>';

    return (
      '<div class="med-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">' +
          '<div>' +
            '<div class="med-nombre">' + m.nombre + '</div>' +
            '<div class="med-doctor"><i class="ti ti-stethoscope"></i> ' + m.doctor + (m.categoria ? ' - ' + m.categoria : '') + '</div>' +
          '</div>' +
          estadoVencimiento +
        '</div>' +
        '<div class="med-dato"><span class="med-dato-k">Dosis por toma</span><span class="med-dato-v">' + m.dosis + ' pastilla' + (m.dosis > 1 ? 's' : '') + '</span></div>' +
        '<div class="med-dato"><span class="med-dato-k">Frecuencia</span><span class="med-dato-v">' + m.frecuencia + ' vez' + (m.frecuencia > 1 ? 'es' : '') + ' por dia</span></div>' +
        '<div class="med-dato"><span class="med-dato-k">Stock actual</span><span class="med-dato-v">' + m.stockActual + ' de ' + m.stockInicial + ' unidades (' + pct + '%)</span></div>' +
        '<div class="med-dato"><span class="med-dato-k">Vencimiento</span><span class="med-dato-v">' + (m.vencimiento || 'No indicado') + '</span></div>' +
        '<div class="stock-barra"><div class="stock-fill" style="width:' + pct + '%;background:' + colorStock(pct) + '"></div></div>' +
        '<div class="stock-txt">' + pct + '% de stock disponible</div>' +
        '<div style="display:flex;gap:10px;margin-top:16px">' +
          '<button class="btn-toma" style="flex:1" onclick="tomaRapida(' + idx + ')"><i class="ti ti-circle-plus"></i> Registrar toma</button>' +
          '<button class="btn-eliminar" onclick="eliminar(' + idx + ')"><i class="ti ti-trash"></i> Eliminar</button>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

function filtrar(v) {
  renderLista(v);
}

function tomaRapida(i) {
  var m = meds[i];
  if (!m) return;
  if (m.stockActual < m.dosis) {
    toast('Stock insuficiente para ' + m.nombre, true);
    return;
  }
  m.stockActual -= m.dosis;
  hist.unshift({
    med:   m.nombre,
    dosis: m.dosis,
    fecha: hoy(),
    hora:  new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  });
  guardar();
  renderLista(document.getElementById('inp-buscar').value);
  toast('Toma de ' + m.nombre + ' registrada. Stock: ' + m.stockActual);
}

function eliminar(i) {
  if (!confirm('Seguro que queres eliminar "' + meds[i].nombre + '"?')) return;
  var nombre = meds[i].nombre;
  meds.splice(i, 1);
  guardar();
  renderLista(document.getElementById('inp-buscar').value);
  toast(nombre + ' eliminado');
}

/* =============================================
   SECCION: REGISTRAR TOMA
   ============================================= */

function renderToma() {
  var sel = document.getElementById('sel-med');
  sel.innerHTML = meds.length
    ? meds.map(function (m) {
        return '<option value="' + m.nombre + '">' + m.nombre + ' (stock: ' + m.stockActual + ')</option>';
      }).join('')
    : '<option>No hay medicamentos cargados</option>';

  actualizarInfoToma();

  var items = hist.slice(0, 10).map(function (h) {
    return (
      '<div class="historial-item">' +
        '<i class="ti ti-circle-check"></i>' +
        '<div>' +
          '<strong style="font-size:17px">' + h.med + '</strong><br>' +
          '<span style="font-size:15px;color:var(--texto-sec)">' + h.fecha + ' a las ' + h.hora + ' - ' + h.dosis + ' unidad' + (h.dosis > 1 ? 'es' : '') + '</span>' +
        '</div>' +
      '</div>'
    );
  });

  document.getElementById('historial-detalle').innerHTML = items.length
    ? items.join('')
    : '<div class="empty"><i class="ti ti-history"></i>Todavia no hay registros.</div>';
}

function actualizarInfoToma() {
  var nombre = document.getElementById('sel-med').value;
  var m = meds.find(function (x) { return x.nombre === nombre; });
  document.getElementById('info-toma').innerHTML = m
    ? '<strong>Dosis:</strong> ' + m.dosis + ' pastilla' + (m.dosis > 1 ? 's' : '') + ' por toma<br>' +
      '<strong>Stock disponible:</strong> ' + m.stockActual + ' unidades'
    : '';
}

function registrarToma() {
  var nombre = document.getElementById('sel-med').value;
  var m = meds.find(function (x) { return x.nombre === nombre; });
  if (!m) { toast('Selecciona un medicamento', true); return; }
  if (m.stockActual < m.dosis) { toast('Stock insuficiente para ' + m.nombre, true); return; }

  m.stockActual -= m.dosis;
  hist.unshift({
    med:   m.nombre,
    dosis: m.dosis,
    fecha: hoy(),
    hora:  new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  });
  guardar();
  renderToma();
  toast('Toma de ' + m.nombre + ' registrada. Stock: ' + m.stockActual);
}

/* =============================================
   SECCION: ALERTAS
   ============================================= */

function renderAlertas() {
  var umbralStock = parseInt(document.getElementById('umbral-s').value) || 5;
  var umbralDias  = parseInt(document.getElementById('umbral-d').value) || 30;
  var als = [];

  meds.forEach(function (m) {
    if (m.stockActual < umbralStock) {
      als.push(
        '<div class="alerta alerta-stock">' +
          '<i class="ti ti-alert-triangle"></i>' +
          '<div>' +
            '<div class="alerta-titulo">' + m.nombre + ' - Stock bajo</div>' +
            '<div class="alerta-detalle">Quedan ' + m.stockActual + ' unidades. Aviso activo por debajo de ' + umbralStock + '.</div>' +
          '</div>' +
        '</div>'
      );
    }
    var d = diasHasta(m.vencimiento);
    if (d < 0) {
      als.push(
        '<div class="alerta alerta-venc">' +
          '<i class="ti ti-x"></i>' +
          '<div>' +
            '<div class="alerta-titulo">' + m.nombre + ' - Vencido</div>' +
            '<div class="alerta-detalle">Vencio hace ' + Math.abs(d) + ' dias. No lo consumas.</div>' +
          '</div>' +
        '</div>'
      );
    } else if (d < umbralDias) {
      als.push(
        '<div class="alerta alerta-stock">' +
          '<i class="ti ti-clock"></i>' +
          '<div>' +
            '<div class="alerta-titulo">' + m.nombre + ' - Por vencer</div>' +
            '<div class="alerta-detalle">Vence el ' + m.vencimiento + ' (en ' + d + ' dias).</div>' +
          '</div>' +
        '</div>'
      );
    }
  });

  if (!als.length) {
    als.push(
      '<div class="alerta alerta-ok">' +
        '<i class="ti ti-circle-check"></i>' +
        '<div>' +
          '<div class="alerta-titulo">Sin alertas</div>' +
          '<div class="alerta-detalle">Todos los medicamentos estan en orden.</div>' +
        '</div>' +
      '</div>'
    );
  }

  document.getElementById('alertas-contenido').innerHTML = als.join('');
}

/* =============================================
   SECCION: DIAS RESTANTES
   ============================================= */

function renderDias() {
  if (!meds.length) {
    document.getElementById('dias-contenido').innerHTML =
      '<div class="empty"><i class="ti ti-calendar-stats"></i>No hay medicamentos cargados.</div>';
    return;
  }

  document.getElementById('dias-contenido').innerHTML = meds.map(function (m) {
    var tomasDia = m.dosis * m.frecuencia;
    var dias     = tomasDia > 0 ? Math.floor(m.stockActual / tomasDia) : 0;
    var pct      = m.stockInicial > 0 ? Math.min(100, Math.round(m.stockActual / m.stockInicial * 100)) : 0;
    var color    = colorStock(pct);

    return (
      '<div class="dias-card">' +
        '<div class="dias-nom">' + m.nombre + '</div>' +
        '<div style="display:flex;align-items:baseline;gap:8px;margin-top:4px">' +
          '<div class="dias-num" style="color:' + color + '">' + dias + '</div>' +
          '<div class="dias-lbl">dias estimados con el stock actual</div>' +
        '</div>' +
        '<div class="stock-barra" style="margin-top:10px">' +
          '<div class="stock-fill" style="width:' + pct + '%;background:' + color + '"></div>' +
        '</div>' +
        '<div class="stock-txt" style="margin-top:5px">' +
          m.stockActual + ' unidades - ' + m.dosis + ' por toma - ' + m.frecuencia + ' vez' + (m.frecuencia > 1 ? 'es' : '') + ' al dia' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/* =============================================
   INICIALIZACION
   ============================================= */

renderInicio();
document.getElementById('sel-med').addEventListener('change', actualizarInfoToma);
