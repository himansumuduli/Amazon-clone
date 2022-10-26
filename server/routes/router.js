const express = require("express");
const router = new express.Router();
const Products = require("../models/productsSchema");
const USER = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authenicate = require("../middleware/authenticate");




router.get("/getproducts", async (req, res)=>{
    try {
        const producstdata = await Products.find();
        // console.log( "console the data" + producstdata);
        res.status(201).json(producstdata);
    } catch (error) {
        console.log("error" + error.message);
    }
});


// get the products data

router.get("/getproductsone/:id", async (req, res) => {
        try {
        const {id} = req.params;
        // console.log(id);
        const individuadata = await Products.findOne({ id: id });
        // console.log(individuadata + "individual data");
        res.status(201).json(individuadata);

    } catch (error) {
        res.status(400).json(individuadata);
        console.log("error" + error.message);
    }
});


// register the data
router.post("/register",async(req,res)=>{

    console.log(req.body);
    const { fname, email, mobile, password, cpassword } = req.body;

    if (!fname || !email || !mobile || !password || !cpassword) {
        res.status(422).json({ error: "fill all the data" });
        console.log("no data available")
    };
    
    try {

        const preuser = await USER.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "This is user is already present" })
        } else if (password !== cpassword) {
            res.status(422).json({ error: "password and cpassword not match" })
        } else {

            const finalUser = new USER({
                fname, email, mobile, password, cpassword
            });

            // yaha pe hasing krenge

            const storedata = await finalUser.save();
            console.log(storedata);
            res.status(201).json(storedata);
        }

    } catch (error) {
       console.log("catch error " + error.message);
       res.status(422).send(error);
    }
})


// login data
router.post("/login", async (req, res) => {
    console.log(req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "fill the details" });
    };
    try {

        const userlogin = await USER.findOne({ email: email });
        console.log(userlogin);
        if (userlogin) {
            
            const isMatch = await bcrypt.compare(password, userlogin.password);
            // console.log(isMatch);

        
            if (!isMatch) {
                res.status(400).json({ error: "invalid detials" });
            } else {
                
        //   tokken generate
        const token =await userlogin.generatAuthtoken();
        console.log(token)
            
        res.cookie("Amazonweb", token, {
            expires: new Date(Date.now() + 900000),
            httpOnly: true
        });
                res.status(201).json({ userlogin });
            }
       
        }else{
            res.status(400).json({ error: "invalid detials" });
        }
    }catch(error) {
        res.status(400).json({ error: "invalid detials" });
       
    }

})

// adding the data into cart
router.post("/addcart/:id",authenicate,async (req, res) => {

    try {
        const { id } = req.params;
        const cart = await  Products.findOne({ id: id });
        console.log(cart + "cart value");

        
        const UserContact = await USER.findOne({ _id: req.userID });
        console.log(UserContact );
        
        if (UserContact) {
            const cartData = await UserContact.addcartdata(cart);

            await UserContact.save();
            console.log(cartData );
            
            res.status(201).json(UserContact);
        }else{
            res.status(401).json({error:"invalid user"});
        }

    } catch(error){

        res.status(401).json({error:"invalid user"});
    }
});


// get data into the cart
router.get("/cartdetails", authenicate, async (req, res) => {
    try {
        const buyuser = await USER.findOne({ _id:req.userID });
        // console.log(buyuser + "user hain buy pr");
        res.status(201).json(buyuser);
    } catch (error) {
        console.log(error + "error ");
    }
});
// get valid user
router.get("/validuser", authenicate, async (req, res) => {
    try {
        const validuserone = await USER.findOne({ _id:req.userID });
        // console.log(buyuser + "user hain buy pr");
        res.status(201).json(validuserone);
    } catch (error) {
        console.log(error + "error");
    }
});

// remove iteam from the cart

router.delete("/remove/:id", authenicate, async (req, res) => {
    try {
        const { id } = req.params;

        req.rootUser.carts = req.rootUser.carts.filter((curel) => {
            return curel.id != id
        });

        req.rootUser.save();
        res.status(201).json(req.rootUser);
        console.log("iteam remove");

    } catch (error) {
        console.log("error hain" + error);
        res.status(400).json(req.rootUser);
    }
});

// for userlogout

router.get("/lougout", authenicate, async (req, res) => {
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem) => {
            return curelem.token !== req.token
        });

        res.clearCookie("Amazonweb", { path: "/" });
        req.rootUser.save();
        res.status(201).json(req.rootUser.tokens);
        console.log("user logout");

    } catch (error) {
        console.log(error + "jwt provide then logout");
    }
});
module.exports = router;





