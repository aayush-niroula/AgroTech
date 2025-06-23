export interface IProduct{
    _id:string
    title:string
    description:string
    price:number
    category:string
    brand:string
    imageUrls:string[]
    quantity:number
    location:{
        type:"Point"
        coordinates:[number, number]

    }
    weight:number
    sellerId:{
        _id:string
        name:string
        avatar?:string
        rating?:number
        isVerified?:boolean
    }
    createdAt:string
    updatedAt:string
    
}