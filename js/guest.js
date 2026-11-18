/* ==========================================================================
SECCIÓN 1 · CONFIRMACIÓN DE ASISTENCIA ORIGINAL
========================================================================== */

(function () {
    'use strict';

    /* =========================================================
     * CONFIGURACIÓN DE LA SECCIÓN 1
     * =======================================================*/
    const guest_config = {
        // CAMBIAR ÚNICAMENTE este valor por la URL /exec o por el ID de implementación.
        endpoint: 'https://script.google.com/macros/s/AKfycby1kCb4hmGhcxQb-5eUjdHNMvWZUyJYw2VfIx1yXCSOo2ecYT53DRg2mDjVOVfuMkARmA/exec',

        max_personas: 10,

        nombre_max_longitud: 80,

        restricciones: [
            { id: 'ninguno', label: 'Ninguno', enabled: true },
            { id: 'diabetico', label: 'Diabético', enabled: false },
            { id: 'celiaco', label: 'Celíaco', enabled: true },
            { id: 'hipertenso', label: 'Hipertenso', enabled: false },
            { id: 'vegano', label: 'Vegano', enabled: true },
            { id: 'vegetariano', label: 'Vegetariano', enabled: true },
            { id: 'intolerante_lactosa', label: 'Intolerante a la lactosa', enabled: false },
            { id: 'kosher', label: 'Kosher', enabled: false }
        ],

        restriccion_inicial: 'ninguno'
    };

    /* =========================================================
     * ESTADO INTERNO
     * =======================================================*/
    let guest_estado = {
        personas: 0,
        invitados: []
    };

    /* =========================================================
     * REFERENCIAS AL DOM
     * =======================================================*/
    const guest_root = document.getElementById('guest');
    const guest_form = document.getElementById('guest_form');
    const guest_select = document.getElementById('guest_personas');
    const guest_guest_list = document.getElementById('guest_guest_list');
    const guest_submit = document.getElementById('guest_submit');
    const guest_errors = document.getElementById('guest_errors');
    const guest_success = document.getElementById('guest_success');
    const guest_success_reset = document.getElementById('guest_success_reset');

    /* =========================================================
     * UTILIDADES
     * =======================================================*/
    function guest_obtener_restricciones_activas() {
        return guest_config.restricciones.filter(function (r) { return r.enabled === true; });
    }

    function guest_restriccion_existe(id) {
        return guest_config.restricciones.some(function (r) {
            return r.id === id && r.enabled === true;
        });
    }

    function guest_escape_html(texto) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(texto));
        return div.innerHTML;
    }

    /* =========================================================
     * INICIALIZACIÓN DEL SELECTOR
     * =======================================================*/
    function guest_inicializar_selector() {
        var placeholder = guest_select.querySelector('[data-guest-placeholder]');
        var fragment = document.createDocumentFragment();

        for (var i = 1; i <= guest_config.max_personas; i++) {
            var option = document.createElement('option');
            option.value = String(i);
            option.textContent = i === 1 ? '1 persona' : i + ' personas';
            fragment.appendChild(option);
        }

        guest_select.appendChild(fragment);

        if (placeholder) {
            guest_select.insertBefore(placeholder, guest_select.firstChild);
        }
    }

    /* =========================================================
     * GENERACIÓN DE INVITADOS
     * =======================================================*/
    function guest_crear_invitado(indice) {
        var numero = indice + 1;
        var guest_id = 'guest_card_' + numero;
        var name_id = 'guest_name_' + numero;

        var restricciones_activas = guest_obtener_restricciones_activas();

        var article = document.createElement('article');
        article.className = 'guest__guest';
        article.setAttribute('data-guest-card', String(indice));

        var restricciones_html = restricciones_activas.map(function (r) {
            var es_inicial = (r.id === guest_config.restriccion_inicial);
            var checked_attr = es_inicial ? ' checked' : '';
            var selected_class = es_inicial ? ' guest__restriction_selected' : '';
            var aria_pressed = es_inicial ? 'true' : 'false';

            return '<label class="guest__restriction' + selected_class + '" data-restriction-id="' + r.id + '">' +
                '<input type="checkbox" name="guest_restriction_' + numero + '" value="' + r.id + '"' + checked_attr + ' aria-pressed="' + aria_pressed + '" hidden>' +
                '<span>' + guest_escape_html(r.label) + '</span>' +
                '</label>';
        }).join('');

        article.innerHTML =
            '<header class="guest__guest_header">' +
            '<h3 class="guest__guest_title">Invitado ' + numero + '</h3>' +
            '<span class="guest__guest_name" data-guest-card-name>Sin nombre</span>' +
            '</header>' +

            '<div class="guest__field">' +
            '<label class="guest__label" for="' + name_id + '">Nombre y apellido</label>' +
            '<input type="text" class="guest__input" id="' + name_id + '" name="' + name_id + '" ' +
            'placeholder="Escribe el nombre completo" ' +
            'maxlength="' + guest_config.nombre_max_longitud + '" ' +
            'autocomplete="name" data-guest-name>' +
            '<span class="guest__field_error" data-guest-name-error hidden></span>' +
            '</div>' +

            '<div class="guest__attendance">' +
            '<span class="guest__attendance_label" id="' + guest_id + '_att_lbl">¿Asiste a la celebración?</span>' +
            '<div class="guest__attendance_options" role="radiogroup" aria-labelledby="' + guest_id + '_att_lbl">' +
            '<label class="guest__attendance_option" data-attendance="si">' +
            '<input type="radio" name="guest_attendance_' + numero + '" value="si" aria-label="Sí, asisto">' +
            '<span>Sí, asisto</span>' +
            '</label>' +
            '<label class="guest__attendance_option" data-attendance="no">' +
            '<input type="radio" name="guest_attendance_' + numero + '" value="no" aria-label="No asisto">' +
            '<span>No asisto</span>' +
            '</label>' +
            '</div>' +
            '<span class="guest__field_error" data-guest-attendance-error hidden></span>' +
            '</div>' +

            '<div class="guest__restrictions">' +
            '<span class="guest__restrictions_label">¿Tiene alguna restricción alimenticia?</span>' +
            '<span class="guest__restrictions_hint">Selecciona una opción.</span>' +
            '<div class="guest__restrictions_grid" data-guest-restrictions-grid>' +
            restricciones_html +
            '</div>' +
            '<span class="guest__field_error" data-guest-restrictions-error hidden></span>' +
            '</div>';

        return article;
    }

    function guest_renderizar_invitados(cantidad) {
        guest_guest_list.innerHTML = '';

        if (cantidad <= 0) {
            guest_estado.invitados = [];
            return;
        }

        var fragment = document.createDocumentFragment();
        var nuevos_invitados = [];

        for (var i = 0; i < cantidad; i++) {
            var invitado = {
                indice: i,
                nombre: '',
                asistencia: null,
                restricciones: [guest_config.restriccion_inicial]
            };
            nuevos_invitados.push(invitado);

            var nodo = guest_crear_invitado(i);
            fragment.appendChild(nodo);
        }

        guest_guest_list.appendChild(fragment);
        guest_estado.invitados = nuevos_invitados;
        guest_estado.personas = cantidad;
    }

    /* =========================================================
     * GESTIÓN DE ASISTENCIA
     * =======================================================*/
    function guest_actualizar_asistencia(guest_node, valor) {
        var opciones = guest_node.querySelectorAll('.guest__attendance_option');
        opciones.forEach(function (opt) {
            var input = opt.querySelector('input[type="radio"]');
            if (opt.getAttribute('data-attendance') === valor) {
                opt.classList.add('guest__attendance_option_selected');
                if (input) input.checked = true;
            } else {
                opt.classList.remove('guest__attendance_option_selected');
                if (input) input.checked = false;
            }
        });

        var restrictions_wrap = guest_node.querySelector('.guest__restrictions');
        if (!restrictions_wrap) return;

        if (valor === 'no') {
            restrictions_wrap.classList.add('guest__restrictions_disabled');
            var checkboxes = restrictions_wrap.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(function (cb) {
                cb.checked = false;
                cb.setAttribute('aria-pressed', 'false');
                cb.disabled = true;
                var label = cb.closest('.guest__restriction');
                if (label) label.classList.remove('guest__restriction_selected');
            });
        } else {
            restrictions_wrap.classList.remove('guest__restrictions_disabled');
            var cbs = restrictions_wrap.querySelectorAll('input[type="checkbox"]');
            cbs.forEach(function (cb) {
                cb.disabled = false;
            });
            guest_resetear_restricciones(guest_node);
        }
    }

    /* =========================================================
     * GESTIÓN DE RESTRICCIONES
     * =======================================================*/
    function guest_resetear_restricciones(guest_node) {
        var grid = guest_node.querySelector('[data-guest-restrictions-grid]');
        if (!grid) return;

        var labels = grid.querySelectorAll('.guest__restriction');
        labels.forEach(function (label) {
            var input = label.querySelector('input[type="checkbox"]');
            var id = label.getAttribute('data-restriction-id');
            var es_inicial = (id === guest_config.restriccion_inicial);

            if (input) {
                input.checked = es_inicial;
                input.setAttribute('aria-pressed', es_inicial ? 'true' : 'false');
            }
            if (es_inicial) {
                label.classList.add('guest__restriction_selected');
            } else {
                label.classList.remove('guest__restriction_selected');
            }
        });
    }

    function guest_toggle_restriccion(label, guest_node) {
        var input = label.querySelector('input[type="checkbox"]');
        if (!input || input.disabled) return;

        var id = label.getAttribute('data-restriction-id');
        if (!guest_restriccion_existe(id)) return;

        /* Selección única: al marcar una opción se desmarcan las demás */
        var grid = guest_node.querySelector('[data-guest-restrictions-grid]');
        var todos = grid.querySelectorAll('.guest__restriction');

        todos.forEach(function (otro) {
            var otro_input = otro.querySelector('input[type="checkbox"]');

            if (otro === label) {
                otro.classList.add('guest__restriction_selected');
                if (otro_input) {
                    otro_input.checked = true;
                    otro_input.setAttribute('aria-pressed', 'true');
                }
            } else {
                otro.classList.remove('guest__restriction_selected');
                if (otro_input) {
                    otro_input.checked = false;
                    otro_input.setAttribute('aria-pressed', 'false');
                }
            }
        });
    }

    /* =========================================================
     * ACTUALIZACIÓN DEL NOMBRE VISIBLE
     * =======================================================*/
    function guest_actualizar_nombre(guest_node) {
        var input = guest_node.querySelector('[data-guest-name]');
        var display = guest_node.querySelector('[data-guest-card-name]');
        if (!input || !display) return;

        var valor = input.value.trim();
        if (valor.length === 0) {
            display.textContent = 'Sin nombre';
            display.classList.remove('guest__guest_name_filled');
            guest_node.classList.remove('guest__guest_active');
        } else {
            display.textContent = valor;
            display.classList.add('guest__guest_name_filled');
            guest_node.classList.add('guest__guest_active');
        }
    }

    /* =========================================================
     * VALIDACIÓN
     * =======================================================*/
    function guest_limpiar_errores() {
        guest_errors.innerHTML = '';
        guest_errors.classList.remove('guest__errors_visible');

        var errores_campo = guest_root.querySelectorAll('[data-guest-name-error], [data-guest-attendance-error], [data-guest-restrictions-error]');
        errores_campo.forEach(function (el) {
            el.textContent = '';
            el.hidden = true;
        });

        var inputs_invalidos = guest_root.querySelectorAll('.guest__input_invalid');
        inputs_invalidos.forEach(function (el) { el.classList.remove('guest__input_invalid'); });
    }

    function guest_mostrar_error_general(mensajes) {
        if (mensajes.length === 0) return;
        guest_errors.innerHTML = '';
        mensajes.forEach(function (m) {
            var item = document.createElement('span');
            item.className = 'guest__errors_item';
            item.textContent = m;
            guest_errors.appendChild(item);
        });
        guest_errors.classList.add('guest__errors_visible');
    }

    function guest_mostrar_error_campo(guest_node, selector, mensaje) {
        var el = guest_node.querySelector(selector);
        if (el) {
            el.textContent = mensaje;
            el.hidden = false;
        }
    }

    function guest_validar() {
        guest_limpiar_errores();
        var errores = [];
        var invitados_validos = [];

        if (guest_estado.personas <= 0) {
            errores.push('Selecciona la cantidad de personas que confirmarán.');
            return { valido: false, errores: errores, datos: null };
        }

        var guest_nodes = guest_guest_list.querySelectorAll('[data-guest-card]');

        guest_nodes.forEach(function (guest_node, idx) {
            var numero = idx + 1;
            var name_input = guest_node.querySelector('[data-guest-name]');
            var nombre_valor = name_input ? name_input.value.trim() : '';

            var attendance_selected = guest_node.querySelector('.guest__attendance_option_selected');
            var asistencia_valor = attendance_selected ? attendance_selected.getAttribute('data-attendance') : null;

            var restricciones_sel = [];
            var grid = guest_node.querySelector('[data-guest-restrictions-grid]');
            if (grid) {
                var checked = grid.querySelectorAll('input[type="checkbox"]:checked');
                checked.forEach(function (cb) {
                    if (!cb.disabled && guest_restriccion_existe(cb.value)) {
                        restricciones_sel.push(cb.value);
                    }
                });
            }

            var invitado_valido = true;

            if (!asistencia_valor) {
                guest_mostrar_error_campo(guest_node, '[data-guest-attendance-error]', 'Selecciona si asiste o no.');
                errores.push('Invitado ' + numero + ': indica si asiste.');
                invitado_valido = false;
            }

            if (nombre_valor.length === 0) {
                if (name_input) name_input.classList.add('guest__input_invalid');
                guest_mostrar_error_campo(guest_node, '[data-guest-name-error]', 'El nombre es obligatorio.');
                errores.push('Invitado ' + numero + ': escribe el nombre completo.');
                invitado_valido = false;
            } else if (nombre_valor.length > guest_config.nombre_max_longitud) {
                if (name_input) name_input.classList.add('guest__input_invalid');
                guest_mostrar_error_campo(guest_node, '[data-guest-name-error]', 'El nombre es demasiado largo.');
                errores.push('Invitado ' + numero + ': nombre demasiado largo.');
                invitado_valido = false;
            }

            if (asistencia_valor === 'si') {
                if (restricciones_sel.indexOf(guest_config.restriccion_inicial) !== -1 && restricciones_sel.length > 1) {
                    guest_mostrar_error_campo(guest_node, '[data-guest-restrictions-error]', '"Ninguno" no puede combinarse con otras restricciones.');
                    errores.push('Invitado ' + numero + ': restricción incompatible.');
                    invitado_valido = false;
                }
            }

            if (invitado_valido) {
                invitados_validos.push({
                    nombre: nombre_valor,
                    asistencia: asistencia_valor,
                    restricciones: (asistencia_valor === 'si') ? restricciones_sel : []
                });
            }
        });

        if (errores.length > 0) {
            guest_mostrar_error_general(errores);
            return { valido: false, errores: errores, datos: null };
        }

        var datos = {
            personas: guest_estado.personas,
            invitados: invitados_validos
        };

        return { valido: true, errores: [], datos: datos };
    }

    /* =========================================================
     * PREPARACIÓN DE DATOS (preparado para Google Apps Script)
     * =======================================================*/
    function guest_obtener_datos() {
        var resultado = guest_validar();
        if (!resultado.valido) return null;
        return resultado.datos;
    }

    /* =========================================================
     * ESTADO DE ÉXITO
     * =======================================================*/
    function guest_mostrar_exito(datos) {
        console.log('[guest] Confirmación procesada en memoria:', datos);

        guest_form.classList.add('guest__form_hidden');
        guest_success.hidden = false;
        guest_success.classList.add('guest__success_visible');

        if (guest_success_reset) {
            guest_success_reset.focus();
        }
    }

    function guest_reiniciar() {
        guest_success.hidden = true;
        guest_success.classList.remove('guest__success_visible');
        guest_form.classList.remove('guest__form_hidden');

        guest_select.value = '';
        guest_estado = { personas: 0, invitados: [] };
        guest_guest_list.innerHTML = '';
        guest_limpiar_errores();

        if (guest_submit) {
            guest_submit.disabled = false;
        }
    }

    /* =========================================================
     * EVENTOS (delegación)
     * =======================================================*/
    function guest_manejar_cambio_select() {
        var valor = parseInt(guest_select.value, 10);
        if (isNaN(valor) || valor < 1 || valor > guest_config.max_personas) {
            guest_renderizar_invitados(0);
            return;
        }
        guest_renderizar_invitados(valor);
    }

    function guest_manejar_click_guest_list(ev) {
        var attendance_label = ev.target.closest('.guest__attendance_option');
        if (attendance_label) {
            var guest_node = attendance_label.closest('[data-guest-card]');
            var valor = attendance_label.getAttribute('data-attendance');
            if (guest_node && valor) {
                guest_actualizar_asistencia(guest_node, valor);
            }
            return;
        }

        var restriction_label = ev.target.closest('.guest__restriction');
        if (restriction_label) {
            var guest_node_r = restriction_label.closest('[data-guest-card]');
            if (guest_node_r) {
                ev.preventDefault();
                guest_toggle_restriccion(restriction_label, guest_node_r);
            }
            return;
        }
    }

    function guest_manejar_input_nombre(ev) {
        var input = ev.target.closest('[data-guest-name]');
        if (input) {
            var guest_node = input.closest('[data-guest-card]');
            if (guest_node) {
                input.classList.remove('guest__input_invalid');
                var err = guest_node.querySelector('[data-guest-name-error]');
                if (err) { err.textContent = ''; err.hidden = true; }
                guest_actualizar_nombre(guest_node);
            }
        }
    }

    function guest_manejar_submit(ev) {
        ev.preventDefault();

        if (guest_submit) guest_submit.disabled = true;

        var resultado = guest_validar();

        if (!resultado.valido) {
            if (guest_submit) guest_submit.disabled = false;
            var primer_error = guest_root.querySelector('.guest__input_invalid, .guest__errors_item');
            if (primer_error) {
                primer_error.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        if (!guest_config.endpoint || guest_config.endpoint.indexOf('PEGAR_AQUI_') === 0) {
            guest_mostrar_error_general(['Configura la URL de Google Apps Script antes de enviar.']);
            if (guest_submit) guest_submit.disabled = false;
            return;
        }

        guest_submit.textContent = 'Enviando…';

        var endpoint = guest_config.endpoint.trim();
        if (endpoint.indexOf('http://') !== 0 && endpoint.indexOf('https://') !== 0) {
            endpoint = 'https://script.google.com/macros/s/' + endpoint.replace(/\/$/, '') + '/exec';
        }

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },
            body: JSON.stringify(resultado.datos)
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                return response.text().then(function (texto) {
                    try {
                        return JSON.parse(texto);
                    } catch (error) {
                        throw new Error('Respuesta inválida de Apps Script.');
                    }
                });
            })
            .then(function (respuesta) {
                if (!respuesta || respuesta.ok !== true) {
                    throw new Error(
                        respuesta && respuesta.error
                            ? respuesta.error
                            : 'La hoja no confirmó el registro.'
                    );
                }
                guest_mostrar_exito(resultado.datos);
            })
            .catch(function (error) {
                console.error('[guest] Error al registrar:', error);
                guest_mostrar_error_general([
                    error && error.message
                        ? error.message
                        : 'No se pudo registrar la confirmación. Revisa tu conexión e inténtalo nuevamente.'
                ]);
                if (guest_submit) {
                    guest_submit.disabled = false;
                    guest_submit.textContent = 'Confirmar asistencia';
                }
            });
    }

    /* =========================================================
     * INICIALIZACIÓN
     * =======================================================*/
    function guest_inicializar() {
        if (!guest_root) return;

        guest_inicializar_selector();

        guest_select.addEventListener('change', guest_manejar_cambio_select);
        guest_guest_list.addEventListener('click', guest_manejar_click_guest_list);
        guest_guest_list.addEventListener('input', guest_manejar_input_nombre);
        guest_form.addEventListener('submit', guest_manejar_submit);

        if (guest_success_reset) {
            guest_success_reset.addEventListener('click', guest_reiniciar);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', guest_inicializar);
    } else {
        guest_inicializar();
    }

    /* API pública para futura integración con Google Apps Script */
    window.guest_obtener_datos = guest_obtener_datos;
    window.guest_config = guest_config;
})();
























/* ==========================================================================
   ██████  WEST 1 (SIN MENÚ ALIMENTICIO)  ██████
   SECCIÓN 2
   ========================================================================== */
(function () {
    'use strict';

    /* Número de la sección, definido mediante constante */
    const GUEST1_NUMERO = 1;

    /* Números de WhatsApp para el envío de la confirmación */
    const GUEST1_WHATSAPP_NUMERO_1 = '5493815550101';
    const GUEST1_WHATSAPP_NUMERO_2 = '5493815550202';
    const GUEST1_WHATSAPP_NUMERO_3 = '5493815550303';

    const GUEST1_WHATSAPP_NUMEROS = {
        '1': GUEST1_WHATSAPP_NUMERO_1,
        '2': GUEST1_WHATSAPP_NUMERO_2,
        '3': GUEST1_WHATSAPP_NUMERO_3
    };

    const guest1_root = document.getElementById('guest1');
    if (!guest1_root) return;

    guest1_root.dataset.numero = String(GUEST1_NUMERO);

    const guest1_form = document.getElementById('guest1_form');
    const guest1_name = document.getElementById('guest1_name');
    const guest1_message = document.getElementById('guest1_message');
    const guest1_attendance_error = document.getElementById('guest1_attendance_error');
    const guest1_name_error = document.getElementById('guest1_name_error');
    const guest1_attendance_group = guest1_root.querySelector('.guest1__attendance_options');
    const guest1_attendance_options = guest1_root.querySelectorAll('.guest1__attendance_option');

    let guest1_attendance_seleccionada = '';

    function guest1_mostrar_error(elemento, mensaje) {
        if (!elemento) return;
        elemento.textContent = mensaje;
        elemento.classList.add('guest1__error_visible');
    }

    function guest1_ocultar_error(elemento) {
        if (!elemento) return;
        elemento.textContent = '';
        elemento.classList.remove('guest1__error_visible');
    }

    function guest1_limpiar_errores() {
        guest1_ocultar_error(guest1_attendance_error);
        guest1_ocultar_error(guest1_name_error);
        if (guest1_name) {
            guest1_name.classList.remove('guest1__input_invalid');
        }
    }

    function guest1_construir_mensaje(nombre, asistencia, mensaje) {
        let texto = 'Hola, ' + nombre + ', quiero confirmar que ' + asistencia + '.';

        if (mensaje) {
            texto += '\n\nY mi mensaje es:\n' + mensaje;
        }

        return texto;
    }

    guest1_attendance_options.forEach(function (opcion) {
        const input = opcion.querySelector('input[type="radio"]');
        if (!input) return;

        input.addEventListener('change', function () {
            if (!input.checked) return;

            guest1_attendance_seleccionada = input.value;

            guest1_attendance_options.forEach(function (otra) {
                otra.classList.toggle('guest1__attendance_option_selected', otra === opcion);
            });

            guest1_ocultar_error(guest1_attendance_error);
        });
    });

    if (guest1_name) {
        guest1_name.addEventListener('input', function () {
            guest1_name.classList.remove('guest1__input_invalid');
            guest1_ocultar_error(guest1_name_error);
        });
    }

    if (guest1_form) {
        guest1_form.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const boton = evento.submitter;
            const clave = boton && boton.dataset.wa ? boton.dataset.wa : '1';
            const numero = GUEST1_WHATSAPP_NUMEROS[clave] || GUEST1_WHATSAPP_NUMERO_1;

            guest1_limpiar_errores();

            const nombre = guest1_name ? guest1_name.value.trim() : '';
            const mensaje = guest1_message ? guest1_message.value.trim() : '';
            let valido = true;

            if (!guest1_attendance_seleccionada) {
                guest1_mostrar_error(guest1_attendance_error, 'Selecciona una opción de asistencia.');
                valido = false;
            }

            if (!nombre) {
                if (guest1_name) {
                    guest1_name.classList.add('guest1__input_invalid');
                }
                guest1_mostrar_error(guest1_name_error, 'Escribe tu nombre.');
                valido = false;
            }

            if (!valido) {
                if (!guest1_attendance_seleccionada) {
                    const primer_radio = guest1_attendance_group
                        ? guest1_attendance_group.querySelector('input[type="radio"]')
                        : null;
                    if (primer_radio) primer_radio.focus();
                } else if (guest1_name) {
                    guest1_name.focus();
                }
                return;
            }

            const texto = guest1_construir_mensaje(nombre, guest1_attendance_seleccionada, mensaje);
            const url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);

            window.open(url, '_blank', 'noopener');
        });
    }
})();















/* ==========================================================================
██████  CONFIRMACIÓN CON MENÚ ALIMENTICIO  ██████
SECCIÓN 3
========================================================================== */
(function () {
    'use strict';

    /* Números de WhatsApp para el envío de la confirmación */
    const GUEST2_WHATSAPP_NUMERO_1 = '5493816660404';
    const GUEST2_WHATSAPP_NUMERO_2 = '5493816660505';
    const GUEST2_WHATSAPP_NUMERO_3 = '5493816660606';

    const GUEST2_WHATSAPP_NUMEROS = {
        '1': GUEST2_WHATSAPP_NUMERO_1,
        '2': GUEST2_WHATSAPP_NUMERO_2,
        '3': GUEST2_WHATSAPP_NUMERO_3
    };

    const guest2_root = document.getElementById('guest2');
    if (!guest2_root) return;

    const guest2_form = document.getElementById('guest2_form');
    const guest2_name = document.getElementById('guest2_name');
    const guest2_message = document.getElementById('guest2_message');
    const guest2_attendance_error = document.getElementById('guest2_attendance_error');
    const guest2_name_error = document.getElementById('guest2_name_error');
    const guest2_attendance_group = guest2_root.querySelector('.guest2__attendance_options');
    const guest2_attendance_options = guest2_root.querySelectorAll('.guest2__attendance_option');
    const guest2_restriction_labels = guest2_root.querySelectorAll('.guest2__restriction');
    const guest2_restriction_inputs = guest2_root.querySelectorAll('.guest2__restriction input[type="radio"]');

    let guest2_attendance_seleccionada = '';

    function guest2_mostrar_error(elemento, mensaje) {
        if (!elemento) return;
        elemento.textContent = mensaje;
        elemento.classList.add('guest2__error_visible');
    }

    function guest2_ocultar_error(elemento) {
        if (!elemento) return;
        elemento.textContent = '';
        elemento.classList.remove('guest2__error_visible');
    }

    function guest2_limpiar_errores() {
        guest2_ocultar_error(guest2_attendance_error);
        guest2_ocultar_error(guest2_name_error);
        if (guest2_name) {
            guest2_name.classList.remove('guest2__input_invalid');
        }
    }

    function guest2_actualizar_restricciones() {
        guest2_restriction_labels.forEach(function (label) {
            const input = label.querySelector('input[type="radio"]');
            label.classList.toggle('guest2__restriction_selected', !!(input && input.checked));
        });
    }

    function guest2_obtener_restricciones() {
        const seleccionadas = [];
        guest2_restriction_inputs.forEach(function (input) {
            if (input.checked) {
                seleccionadas.push(input.value);
            }
        });
        return seleccionadas;
    }

    function guest2_construir_mensaje(nombre, asistencia, restricciones, mensaje) {
        let texto = 'Hola, ' + nombre + ', quiero confirmar que ' + asistencia + '.';

        if (restricciones.length === 0 || restricciones.indexOf('Ninguna') !== -1) {
            texto += '\n\nNo declaro restricciones alimenticias.';
        } else {
            texto += '\n\nMis restricciones alimenticias: ' + restricciones.join(', ') + '.';
        }

        if (mensaje) {
            texto += '\n\nY mi mensaje es:\n' + mensaje;
        }

        return texto;
    }

    guest2_attendance_options.forEach(function (opcion) {
        const input = opcion.querySelector('input[type="radio"]');
        if (!input) return;

        input.addEventListener('change', function () {
            if (!input.checked) return;

            guest2_attendance_seleccionada = input.value;

            guest2_attendance_options.forEach(function (otra) {
                otra.classList.toggle('guest2__attendance_option_selected', otra === opcion);
            });

            guest2_ocultar_error(guest2_attendance_error);
        });
    });

    guest2_restriction_inputs.forEach(function (input) {
        input.addEventListener('change', function () {
            guest2_actualizar_restricciones();
        });
    });

    if (guest2_name) {
        guest2_name.addEventListener('input', function () {
            guest2_name.classList.remove('guest2__input_invalid');
            guest2_ocultar_error(guest2_name_error);
        });
    }

    if (guest2_form) {
        guest2_form.addEventListener('submit', function (evento) {
            evento.preventDefault();

            const boton = evento.submitter;
            const clave = boton && boton.dataset.wa ? boton.dataset.wa : '1';
            const numero = GUEST2_WHATSAPP_NUMEROS[clave] || GUEST2_WHATSAPP_NUMERO_1;

            guest2_limpiar_errores();

            const nombre = guest2_name ? guest2_name.value.trim() : '';
            const mensaje = guest2_message ? guest2_message.value.trim() : '';
            const restricciones = guest2_obtener_restricciones();
            let valido = true;

            if (!guest2_attendance_seleccionada) {
                guest2_mostrar_error(guest2_attendance_error, 'Selecciona una opción de asistencia.');
                valido = false;
            }

            if (!nombre) {
                if (guest2_name) {
                    guest2_name.classList.add('guest2__input_invalid');
                }
                guest2_mostrar_error(guest2_name_error, 'Escribe tu nombre.');
                valido = false;
            }

            if (!valido) {
                if (!guest2_attendance_seleccionada) {
                    const primer_radio = guest2_attendance_group
                        ? guest2_attendance_group.querySelector('input[type="radio"]')
                        : null;
                    if (primer_radio) primer_radio.focus();
                } else if (guest2_name) {
                    guest2_name.focus();
                }
                return;
            }

            const texto = guest2_construir_mensaje(nombre, guest2_attendance_seleccionada, restricciones, mensaje);
            const url = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(texto);

            window.open(url, '_blank', 'noopener');
        });
    }

    guest2_actualizar_restricciones();
})();
