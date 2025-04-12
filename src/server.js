import express from 'express'
import{CONNECT_DB, GET_DB} from'~/config/mongodb'

const START_SERVER = () => {
  const app = express()
  const hostname = 'localhost'
  const port = 8017

  app.get('/', async (req, res) => {
    console.log(await GET_DB().listCollections().toArray())
    res.send('Hello World!')
  })

  
  app.listen(port, hostname, () => {
    // eslint-disable-next-line no-console
    console.log(`CodeUp đang được chạy http://${ hostname }:${ port }`)
  })
}

CONNECT_DB() 
.then(() => console.log('Kết nối tới MongoDB thành công'))
.then(() => START_SERVER())
.catch(error => {console.error(error)
  process.exit(0)
})