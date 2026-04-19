<?php
/**
 * API Simple de Almacenamiento para Municipios de Málaga
 * Este archivo debe estar en la misma carpeta que el juego en tu servidor.
 */

// Nombre del archivo donde se guardarán los datos
$filename = 'data.json';

// Cabeceras para permitir peticiones AJAX y formato JSON
header('Content-Type: application/json');

// Obtener el método de la petición
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // CARGAR DATOS
    if (file_exists($filename)) {
        $content = file_get_contents($filename);
        if ($content === false) {
            http_response_code(500);
            echo json_encode(['error' => 'No se pudo leer el archivo de datos']);
            exit;
        }
        echo $content;
    } else {
        // Si no existe el archivo, devolvemos un objeto vacío o null
        echo json_encode(null);
    }
} elseif ($method === 'POST') {
    // GUARDAR DATOS
    // Recibir el JSON crudo del cuerpo de la petición
    $json_data = file_get_contents('php://input');

    if (!$json_data) {
        http_response_code(400);
        echo json_encode(['error' => 'No se han recibido datos']);
        exit;
    }

    // Validar que sea un JSON válido antes de guardar
    $decoded = json_decode($json_data);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['error' => 'El formato JSON es inválido']);
        exit;
    }

    // Guardar en el archivo (sobrescribe el anterior)
    // Usamos LOCK_EX para evitar que dos personas guarden a la vez y corrompan el archivo
    if (file_put_contents($filename, $json_data, LOCK_EX)) {
        echo json_encode(['success' => true, 'message' => 'Datos guardados en el servidor']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo escribir en el disco. Revisa los permisos de la carpeta.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?>
