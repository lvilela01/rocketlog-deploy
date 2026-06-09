import { Request, Response } from "express";
import { prisma } from "@/database/prisma";
import { z } from 'zod'

export class DeliveriesStatusController {
  async update(request: Request, response: Response){
    // Validação dos parâmetros
    const paramsSchema = z.object({
      id: z.uuid() // Recupera o id do pedido que queremos atualizar
    })


    const bodySchema = z.object({
      status: z.enum(['processing', 'shipped', 'delivered']) // accept only these statuses
    })

    // Validando o parâmetro e corpo da requisição.
    const { id } = paramsSchema.parse(request.params)
    const { status } = bodySchema.parse(request.body)

    // Aqui indicamos o que queremos atualizar e o id do pedido enviado.
    await prisma.delivery.update({
      data: {
        status,
      },
      where: {
        id
      }
    })

    await prisma.deliveryLogs.create({
      data: {
        deliveryId: id,
        description: status
      }
    })

    return response.json()
  }
}
