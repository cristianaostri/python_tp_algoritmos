from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def agregar_medicamento():
    nombre = input("Ingrese el nombre del medicamento: ")
    dosis = int(input("Ingrese la cantidad de pastillas/ml por cada toma: "))
    frecuencia = int(input("Ingrese la cantidad de tomas diarias (Ej: si toma cada 8 horas son 3): "))
    
    fecha_inicio = datetime.strptime(input("Ingrese la fecha de inicio (YYYY-MM-DD): "), "%Y-%m-%d")
    fecha_termino = datetime.strptime(input("Ingrese la fecha de término (YYYY-MM-DD): "), "%Y-%m-%d")
    while fecha_termino < fecha_inicio:
        print("Error: la fecha de término no puede ser anterior a la fecha de inicio.")
        fecha_termino = datetime.strptime(input("Ingrese la fecha de término (YYYY-MM-DD): "),"%Y-%m-%d")
    
    stock = int(input("Ingrese el stock total disponible del medicamento: "))
    while stock <= 0:
        stock = int(input("El stock no puede ser 0 o menor. Ingrese el stock total disponible del medicamento: "))
    vencimiento = datetime.strptime(input("Ingrese la fecha de vencimiento (YYYY-MM-DD): "), "%Y-%m-%d")
    if vencimiento <= datetime.now():
        print("El medicamento ingresado ya ha vencido. No emitira alertas por vencimiento.")
    nombre_doctor = input("Ingrese el nombre del doctor que recetó el medicamento: ")
    
    medicamento = {
        "nombre": nombre,
        "dosis": dosis,
        "frecuencia": frecuencia,
        "fecha_inicio": fecha_inicio,
        "fecha_termino": fecha_termino,
        "stock": stock,
        "vencimiento": vencimiento,
        "nombre_doctor": nombre_doctor
    }
    return medicamento

def mostrar_medicamentos(medicamentos):
    if not medicamentos:
        print("No hay medicamentos registrados.")
        return
    for med in medicamentos:
        print(f"\nNombre: {med['nombre']}")
        print(f"Dosis por toma: {med['dosis']}")
        print(f"Frecuencia: {med['frecuencia']}")
        print(f"Fecha de inicio: {med['fecha_inicio'].strftime('%Y-%m-%d')}")
        print(f"Fecha de término: {med['fecha_termino'].strftime('%Y-%m-%d')}")
        print(f"Stock actual: {med['stock']}")
        print(f"Vencimiento: {med['vencimiento'].strftime('%Y-%m-%d')}")
        print(f"Doctor: {med['nombre_doctor']}")
        print("-" * 30)

def registrar_toma(medicamentos, nombre_buscar):
    for med in medicamentos:
        if med['nombre'].lower() == nombre_buscar.lower():
            if med['stock'] >= med['dosis']:
                med['stock'] -= med['dosis']
                print(f"Se ha registrado la toma de {med['nombre']}. Stock restante: {med['stock']}")
            else:
                print(f"¡Alerta! No hay suficiente stock para descontar la dosis de {med['nombre']}.")
            return
    print("Medicamento no encontrado.")

def verificar_alertas(medicamentos, umbral_stock, dias_vencimiento):
    hoy = datetime.now()
    for med in medicamentos:
        if med['stock'] < umbral_stock:
            print(f"Alerta: El stock de {med['nombre']} es menor a {umbral_stock}. Stock actual: {med['stock']}")
        
        else:
            print("Ningún medicamento esta dentro del umbral especificado para la alerta de stock.")

        dias_faltantes = (med['vencimiento'] - hoy).days
        if dias_faltantes < dias_vencimiento and dias_faltantes >= 0:
            print(f"Alerta: El medicamento {med['nombre']} está próximo a vencer. Vence en {dias_faltantes} días.")

        else:
            print("Ningún medicamento esta dentro del umbral especificado para la fecha de vencimiento.")


def calcular_dias_restantes(medicamentos):
    for med in medicamentos:
        if med['dosis'] > 0:
            total_dia = med['dosis'] * med['frecuencia']
            dias_restantes = med['stock'] // total_dia
            print(f"El medicamento {med['nombre']} tiene suficiente stock para aproximadamente {dias_restantes} días.")
        else:
            print(f"Error en la dosis de {med['nombre']}.")

def buscar_medicamento(medicamentos, nombre_buscar):
    for med in medicamentos:
        if med['nombre'].lower() == nombre_buscar.lower():
            print(f"\nNombre: {med['nombre']}")
            print(f"Dosis: {med['dosis']}")
            print(f"Frecuencia: {med['frecuencia']}")
            print(f"Fecha de inicio: {med['fecha_inicio'].strftime('%Y-%m-%d')}")
            print(f"Fecha de término: {med['fecha_termino'].strftime('%Y-%m-%d')}")
            print(f"Stock: {med['stock']}")
            print(f"Vencimiento: {med['vencimiento'].strftime('%Y-%m-%d')}")
            print(f"Doctor: {med['nombre_doctor']}")
            return
    print("Medicamento no encontrado.")

def hablar_con_ia():
    historial = [
        {
            "role": "system",
            "content": "Eres un asistente medico que responde consultas sobre medicamente, por ejemplo, nombres y dosis usando VANDEMECUM ARGENTINO. NO DEBES HABLAR DE NADA NO RELACIONADO CON ASISTENCIA SOBRE MEDICAMENTOS. NO USES MARKDOWN SOLO PODES USAR LISTAS NUMERADAS O CON LETRAS, NO NEGRITAS, TITULOS, ETC."
        }
    ]

    print("\nChat iniciado. Escribe 'salir' para volver al menú.\n")
    
    mensaje = ""

    while mensaje.lower() != "salir":
        mensaje = input("Tú: ")

        if mensaje.lower() == "salir":
            print("Saliendo del chat...\n")

        # Agregar mensaje del usuario
        historial.append({
            "role": "user",
            "content": mensaje
        })

        # Enviar toda la conversación
        response = client.responses.create(
            model="gpt-5.5",
            input=historial
        )

        respuesta = response.output_text

        print(f"IA: {respuesta}\n")

        # Guardar respuesta del asistente
        historial.append({
            "role": "assistant",
            "content": respuesta
        })

def main():
    medicamentos = []
    opcion = ""
    while opcion != "9":
        print("\n--- MENÚ PRINCIPAL ---")
        print("1. Agregar medicamento")
        print("2. Mostrar medicamentos")
        print("3. Registrar toma")
        print("4. Cargar alertas de medicamentos")
        print("5. Calcular días restantes")
        print("6. Buscar medicamento")
        print("7. Verificar alertas de medicamentos")
        print("8. Consultar sobre medicamentos con el asistente")
        print("9. Salir")
        
        opcion = input("Seleccione una opción: ")
        
        if opcion == "1":
            medicamentos.append(agregar_medicamento())
        elif opcion == "2":
            mostrar_medicamentos(medicamentos)
        elif opcion == "3":
            nombre = input("Ingrese el nombre del medicamento para registrar la toma: ")
            registrar_toma(medicamentos, nombre)
        elif opcion == "4":
            umbral = int(input("Ingrese el umbral de stock para alertas: "))
            dias_venc = int(input("Ingrese los días de margen para alerta de vencimiento: "))
        elif opcion == "5":
            calcular_dias_restantes(medicamentos)
        elif opcion == "6":
            nombre = input("Ingrese el nombre del medicamento a buscar: ")
            buscar_medicamento(medicamentos, nombre)
        elif opcion == "7":
            verificar_alertas(medicamentos, umbral, dias_venc)
        elif opcion == "8":
            hablar_con_ia()
        elif opcion == "9":
            print("Saliendo del sistema...")
        else:
            print("Opción no válida. Intente nuevamente.")

if __name__ == "__main__":
    main()
