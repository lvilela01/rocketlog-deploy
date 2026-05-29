import { Request, Response } from "express";
import { includes, z } from 'zod'
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";

export class DeliveryLogsController {
  async create(request: Request, response: Response){
    const bodySchema = z.object({
      delivery_id: z.uuid(),
      description: z.string()
    })

    const { delivery_id, description } = bodySchema.parse(request.body)

    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id }
    })

    if(!delivery){
      throw new AppError('delivery not found', 404)
    }

    if(delivery.status === 'delivered'){
      throw new AppError('this order has already been delivered')
    }

    if(delivery.status === 'processing'){
      throw new AppError('change status to shipped')
    }

    await prisma.deliveryLogs.create({
      data: {
        deliveryId: delivery_id,
        description
      }
    })

    return response.status(201).json()
  }

  async show(request: Request, response: Response){
    const paramsSchema = z.object({
      delivery_id: z.uuid(),
    })

    const { delivery_id } = paramsSchema.parse(request.params)

    const delivery = await prisma.delivery.findUnique({
      where: { id: delivery_id },
      include: {
        logs: true,
        user: true
      }
    })

    if(!delivery){
      return response.status(404).json({message: 'Delivery not found!'})
    }

    if(request.user?.role === 'customer' && request.user.id !== delivery?.userId){
      throw new AppError('the user can only view their deliveries', 401)
    }

    return response.json(delivery)
  }
}
