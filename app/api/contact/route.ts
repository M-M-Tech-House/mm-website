import { Resend } from "resend"
import { NextResponse } from "next/server"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json()

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      )
    }

    const { data, error } = await resend.emails.send({
      from: "M&M Tech House <onboarding@resend.dev>",
      to: [process.env.RESEND_TO_EMAIL!],
      replyTo: email,
      subject: `💬 Nuevo contacto de ${name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px; border-radius: 12px;">
          <div style="border-bottom: 3px solid #8CC63F; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="margin: 0; font-size: 22px; color: #8CC63F;">🚀 Nuevo mensaje de contacto</h1>
            <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">M&amp;M Tech House — Formulario web</p>
          </div>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; width: 100px; vertical-align: top;">Nombre</td>
              <td style="padding: 10px 0; font-weight: bold;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Email</td>
              <td style="padding: 10px 0;">
                <a href="mailto:${email}" style="color: #8CC63F;">${email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; vertical-align: top;">Mensaje</td>
              <td style="padding: 10px 0; white-space: pre-wrap; line-height: 1.6;">${message}</td>
            </tr>
          </table>

          <div style="margin-top: 32px; padding: 16px; background: #1e293b; border-radius: 8px; border-left: 3px solid #004A99;">
            <p style="margin: 0; font-size: 13px; color: #94a3b8;">
              💡 Podés responder directamente a este email — irá directo a <strong style="color: #f8fafc;">${email}</strong>
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { error: "Error al enviar el mensaje" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error("Contact route error:", err)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
