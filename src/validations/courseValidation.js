import Joi from 'joi';
import{StatusCodes} from 'http-status-codes'

const createNew = async (req, res, next) => {
    const correcCondition = Joi.object({
        title: Joi.string().required().min(3).max(30).trim().strict().messages({
            'any.required': 'Title is required',
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 3 characters long',
            'string.max': 'Title must be at most 30 characters long',
            'string.trim': 'Title must not contain leading or trailing spaces',
            'string.strict': 'Title must not contain special characters',
        }),
        description: Joi.string().required().min(3).max(250).trim().strict(),
        image: Joi.string().required().uri(),
        price: Joi.number().required().min(0).max(1000000),
        category: Joi.string().required().valid('web', 'mobile', 'design', 'game'),
    })

    try {
        console.log(req.body);
        // chi dinh arbortEarly: false de tra ve tat ca cac loi neu co
        await correcCondition.validateAsync(req.body,{abortEarly: false})

        //validate data xong hợp lệ thì cho đi tiếp
        next()
        res.status(StatusCodes.CREATED).json({message: 'POST API create new courses'})

    } catch (error) {
        console.log(error);
        res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            errors: new Error(error).message
        })
    }
}


export const courseValidation = {createNew}