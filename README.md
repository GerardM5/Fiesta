# dos·cientos — Competición de fiesta

Aplicación web para dirigir una competición presencial entre dos equipos. La televisión muestra el estado de la ronda y el panel de administración permite controlar minijuegos, perdedores y castigos.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación y arranque

Desde la carpeta del proyecto, instala las dependencias y levanta el servidor de desarrollo:

```bash
npm install
npm run dev
```

Vite mostrará una dirección local, normalmente `http://localhost:5173`.

Para que la televisión y el móvil puedan abrir la aplicación desde la misma red local, inicia el servidor exponiéndolo a la red:

```bash
npm run dev -- --host 0.0.0.0
```

Después, abre la dirección de red que indique Vite desde los dispositivos necesarios.

## Rutas

| Ruta | Uso |
| --- | --- |
| `/` | Pantalla pública para televisión. |
| `/admin` | Panel de control optimizado para móvil. |
| `/admin/configuracion` | Configuración de evento, equipos, minijuegos y castigos. |

## Preparar la fiesta

1. Abre `/admin/configuracion`.
2. En **General**, cambia el nombre del evento, los nombres de los equipos y sus colores.
3. En **Minijuegos** y **Castigos**, añade, edita, activa o desactiva las opciones que deben aparecer en las ruletas.
4. Pulsa **Guardar cambios**.
5. Abre `/` en la televisión y `/admin` en el dispositivo de control.

## Dirigir una ronda

1. En el panel, pulsa **Empezar ronda**.
2. Pulsa **Girar ruleta** para escoger un minijuego. Los minijuegos activos no se repiten hasta que hayan aparecido todos.
3. Tras realizar el reto, pulsa **Seleccionar perdedor** y elige uno de los equipos.
4. Ve a la ruleta de castigos y gírala. Los castigos siguen la misma regla de no repetición.
5. Cuando se haya cumplido el castigo, pulsa **Nueva ronda**.

El botón **Reiniciar al inicio** devuelve la partida a la pantalla inicial sin modificar la configuración ni el listado de opciones.

## Persistencia y sincronización

La configuración y el estado de la partida se guardan en el almacenamiento local del navegador. Las pestañas abiertas en el mismo navegador se actualizan automáticamente.

Esta versión no incluye backend: para sincronizar una TV y un móvil en dispositivos distintos hace falta conectar un almacenamiento compartido (por ejemplo, Supabase) y sustituir la capa de almacenamiento local.

## Compilación de producción

```bash
npm run build
```

Los archivos estáticos generados se guardan en `dist/`.
