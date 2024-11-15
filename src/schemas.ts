import * as yup from "yup"


export const createInstance = yup.object({
    flavourId: yup.string().required(),
    imageId: yup.string().uuid().required(),
    name: yup.string().uuid().required(),
    networkId: yup.string().required(),
    securityGroups: yup.array().of(yup.object({ name: yup.string().required() }))
})

export type CreateInstanceInput = yup.InferType<typeof createInstance>;