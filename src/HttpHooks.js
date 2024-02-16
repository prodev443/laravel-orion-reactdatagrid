import axios from 'axios'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

export function useHttpClient () {
  const request = async ({ url = '', method = 'GET', headers = { 'Content-Type': 'application/json' }, data, successTitle = '', successMessage = '' }) => {
    const customAlert = withReactContent(Swal)
    try {
      const { data: responseData } = await axios({
        url,
        method,
        headers,
        data
      })
      if (successTitle !== '' && successMessage !== '') {
        const alertMessage = { icon: 'success', timer: 3000, title: successTitle, text: successMessage }
        await customAlert.fire(alertMessage)
      }
      return Promise.resolve(responseData)
    } catch (error) {
      const alertMessage = { icon: 'error', timer: 3000 }
      const response = error?.response
      if (response) {
        const { status } = response
        if (status === 422) {
          console.error(error.toJSON())
          alertMessage.title = 'Error de validación'
          alertMessage.text = 'Ocurrió un error al intentar validar los datos de la solicitud, contacte al administrador del sistema'
        } else {
          console.error(error.toJSON())
          alertMessage.title = 'Error en el servidor'
          alertMessage.text = 'Ocurrió un error inesperado en el servidor, contacte al administrador del sistema'
        }
      } else if (error.request) {
        alertMessage.title = 'Error Interno'
        alertMessage.text = 'Solicitud enviada, sin embargo, no se obtuvo respuesta del servidor, contacte al administrador del sistema'
        console.error(error.request)
      } else {
        alertMessage.title = 'Error en la aplicación'
        alertMessage.text = 'No se pudo enviar la solicitud, contacte al administrador del sistema'
        console.error('Error', error.message)
      }
      await customAlert.fire(alertMessage)
      return Promise.reject(error)
    }
  }

  return { request }
}
