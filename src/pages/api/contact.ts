import type { APIRoute } from 'astro'
import SibApiV3Sdk from 'sib-api-v3-sdk'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
     try {
          const body = await request.json()
          const { subject, html } = body

          console.log('Received data:', { subject, html })

          // iniciazate the Brevo client

          const client = SibApiV3Sdk.ApiClient.instance
          const apiKey = client.authentications['api-key']
          apiKey.apiKey = import.meta.env.BREVO_API_KEY

          const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

          const sendMail = {
               sender: {
                    name: 'Portfolio Roberth',
                    email: 'contact@roberth.dev',
               },
               to: [{ email: import.meta.env.RECIPIENT_EMAIL }],
               htmlContent: html,
               subject: subject,
          }

          await apiInstance.sendTransacEmail(sendMail)

          return new Response(
               JSON.stringify({
                    success: true,
                    message: 'Contact email sent successfully.',
               }),
               { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
     } catch (error) {
          console.error('Error sending contact email:', error)
          return new Response(
               JSON.stringify({
                    success: false,
                    message: 'Failed to send contact email.',
               }),
               { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
     }
}
