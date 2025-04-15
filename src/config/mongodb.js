import {MongoClient, ServerApiVersion} from 'mongodb'
import { env } from '~/config/environment'

//Khởi tạo một đối tượng CodeupDatabaseInstance ban đầu là null (vì chưa connect)
//Đối tượng này sẽ được sử dụng để kết nối đến MongoDB
let CodeupDatabaseInstance = null

//Khởi tạo một đối tượng mongodbClient với thông tin kết nối đến MongoDB
const mongodbClient = new MongoClient(env.MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
)

//Kết nối tới database MongoDB
export const CONNECT_DB = async () => {
    //Gọi kết nối mongoDB atlas với URI đã khai báo trong  thân của mongodbClient
    await mongodbClient.connect()
    //Kết nối thành công thì lấy database với tên DATABASE_NAME
    CodeupDatabaseInstance = mongodbClient.db(env.DATABASE_NAME)
}

//Funstion GET_DB(không async) có nhiệm vụ export ra CodeupDatabaseInstance sau khi đã connect thành công tới MongoDB để sử dụng trong các file khác
//Lưu ý: phải đảm bảo luôn gọi GET_DB sau khi kết nối thành công tới MongoDB
export const GET_DB = () => {
    if (! CodeupDatabaseInstance) {
        throw new Error('Database not connected')
    }
    return CodeupDatabaseInstance
}

