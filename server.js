//#region setup
const express = require('express')
const { 
    db,
    User,
    Vendor,
    Product,
    Cart
  
}=require('./db')
const app = express()

const SERVER_PORT = process.env.PORT || 9090 

app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))

app.use('/',
  express.static(__dirname + '/libraries')
)
//#endregion

//#region Get All Vendor
app.get('/shopping/vendor', async (req, res) => {
    const vendor = await Vendor.findAll()
    res.send(vendor)
})
//#endregion

//#region Get All Product
app.get('/product', async (req, res) => {
    const product = await Product.findAll({
        include:Vendor
    })
    res.send(product)
})
//#endregion

//#region Add Vendor
app.post('/Vendor/addVendor', async (req, res) => {

    try {
        if (req.body.name == 'null' && req.body.email == '') { 
            res.send(success=false)
        }
        console.log(req.body.name)
        console.log(req.body.email)
      const result = await Vendor.create({
        name: req.body.name,
        email: req.body.email  
      })

      res.send({success: true})
    } catch (e) {
      res.send({success: false, err: e.message})
    }
})
//#endregion

//#region Remove Vendor
app.delete('/shopping/:id', async (req, res) => { 
    try {
        console.log("in del" + req.params.id)
        if (req.params.id == null || req.params.id == "") {
            res.send(success = false, message = "No record found")
        } else {
            const vendor = await Vendor.findOne({
                where: {
                    id: req.params.id
                }
            })
            
            const product=await Product.destroy({
                where: {
                    vendorId:req.params.id
                }
            }
            )
            const result = await Vendor.destroy({
                where: {
                    id: req.params.id
                }

            })
       
            res.send(success = true)
        }
    } catch (e) { 
         res.send(success=false)
    }
})
//#endregion

//#region Add Product
app.post('/Products/products', async (req, res) => {
    console.log("i am in server post")
    
    console.log(req.body)
    try {
        if (req.body.name == '' && req.body.price == '' && req.body.quantity == '') {
            res.send(success = false)
        }
     
      
            const result = await Product.create({
                name: req.body.name,
                price: req.body.price,
                quantity: req.body.quantity,
            })
            const vendor = await Vendor.findOne({
                where: {
                    id: req.body.vendorId
                }
            })
            vendor.addProduct(result)
            res.send({ success: true })
        
    } catch (e) {
      res.send({success: false, err: e.message})
    }
})
//#endregion

//#region Remove Product
app.delete('/product/:id', async (req, res) => { 
    try {
        console.log("in del" + req.params.id)
        if (req.params.id == null || req.params.id == "") {
            res.send(success = false, message = "No record found")
        } else {
            const result = await Product.destroy({
                where: {
                    id: req.params.id
                }
            })
            res.send(success = true, message = "successfully removed...")
        }
    } catch (e) { 
        res.send({success:false,err:e.message})
    }
})
//#endregion

//#region Login 
app.post('/login', async (req, res) => { 
  console.log("I am in Server"+req.body.email)
    try {
        if (req.body.email == null || req.body.email == "") {
            res.send(success=false)
        }
        else {
            const user = await User.findOne(
                {
                    where: {
                        email: req.body.email
                    }
                }
            )  
            console.log("User Info" + user)
            res.send(user)  
        }
    }
    catch (e) { 
        res.send(success=false)
    }
})
//#endregion

//#region db sync
db.sync()
.then(() => {
console.log("Database have been synced")
app.listen(SERVER_PORT, function () {
      console.log("Server started on http://localhost:9090/Home.html");
});
}
)
    .catch((err) => console.error(err)) 
  //#endregion 

//#region Add User
app.post('/Users/adduser', async (req, res) => {
    console.log("I am in server" + req.body.email)
    try {
        if (req.body.name == 'null' && req.body.email == '') {
            res.send(success = false)
        }
        console.log(req.body.name)
        console.log(req.body.email)
        const result = await User.create({
            name: req.body.name,
            email: req.body.email
        })
    
        res.send({ success: true })
    } catch (e) {
        res.send({ success: false, err: e.message })
    }
})
    //#endregion

//#region FetchAllItems
app.get('/items/:email', async (req, res) => { 
    const user =await User.findOne(
        {
            where:{
            email:req.params.email
            }
        }
    ) 

    const item = await Cart.findAll({
        where: {
            userId:user.id
        },
        include: [
            {
                model: Product,
                include: [{ model: Vendor }]
            },
            {
                model: User
            }]
       
    })
    res.send(item)
})
//#endregion

//#region updateQuantityOfCart
app.get('/getitems/:email', async (req, res) => {
    console.log(req.params.email)
    try {

       (async () => {
          const item= await Cart.findAll({
                include: [
                    {
                        model: Product,
                        include: [Vendor]
                    },
                    User
                ]
            })
        })();
        const user =await User.findOne(
            {
                where:{
                email:req.params.email
                }
            }
        )     
         console.log("I am in server ",user)
        const tot = await Cart.sum('quantity',
            {
            where: {
             userId:user.id
            }
            })
        if (tot > 0) {
            res.send({ success: true, count: tot })
        } else {
            res.send({ success: true, count: 0 })
        }
     
    } catch (e) { 
        res.send({ success :false,error:e.message})
    }
   
   
})
//#endregion

//#region Add to Cart
app.post('/addtocart', async (req, res) => {
    try {
               console.log(req.body.id)
        const user = await User.findOne({
            where: {
                email:req.body.uemail
            }
        })
       const product = await Product.findOne({
            where: {
                id: parseInt(req.body.id)
            }
        })
        const cart = await Cart.findOne({
            where: {
                productId: parseInt(req.body.id),
                userId:user.id
            }
        })
        if (cart === null) {

            const result = await Cart.create({
                quantity: 1,
                total: 0
            })
            user.addCart(result)
            product.addCart(result)
            res.send({ success: true })
            
        } else { 
            if (cart.quantity < product.quantity) {
                cart.increment({
                    quantity: 1
                })
                res.send({ success: true })
            }
            else { 
                res.send({ success: false, err:"quantity exceeded..!" })
            }
        }
    } catch (e) { 
        console.log(e.message)
        res.send({ success: true })
    }
})
//#endregion

//#region Subtract Quantity Of Item
app.post('/subtractqty/:id', async (req, res) => {
    try{
        const cart = await Cart.findOne({
            where: {
               id:parseInt(req.params.id)
            },
            include: [
                { model: Product, include: [{ model: Vendor }] },
                {
                    model: User
                }]
         })
        if(cart.quantity - 1 > 0 ){
                    const updatecart = await Cart.update({
                        quantity: cart.quantity-1,
                        }, {
                        where: {
                            id: cart.id
                        }
                        })
                    res.send({success:true})
                }else{
                           const result = await Cart.destroy({
                            where:{
                                id: parseInt(req.params.id)
                            }
                        })
                        res.send({success:true})
                }
     res.send({success: true})
    }catch(e){
        console.log(e.message)
        res.send({success: false, err: e.message})
    }
})
//#endregion