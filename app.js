//

const { concatSeries } = require('async');
const express = require('express');
const app = express();
const mongoose = require("mongoose");
const methodOverride = require('method-override');



mongoose.connect("mongodb://localhost:27017/Bank", { useNewUrlParser: true, useUnifiedTopology: true });
   

// mongoose.set('useFindAndModify', false);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.use(express.urlencoded({extended: true}));
mongoose.set('useFindAndModify', false);

const transactionSchema = new mongoose.Schema({
    fromName : {
        type : String,
        required: true
    },
    toName : {
        type : String,
        required: true
    },
    transfer : {
        type : Number,
        required: true
    }
})

const Transactions = mongoose.model('Transaction', transactionSchema);

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        min: 0,
        required: true
    }
})

const Users = mongoose.model('User', userSchema);
//------------------------------------------------------------------------



app.get("/", (req, res)=>{
    res.render("index");
});

app.get("/sender", async (req, res)=>{
    const users = await Users.find({})
    res.render("sender", {users});
});

app.get("/sender/:id", async(req, res) =>{
    const { id } = req.params;
    const user = await Users.findById(id);
    const users = await Users.find({})
    res.render("reciver", {user, users});
});

app.get("/sender/:id1/:id2", async(req, res) =>{
    const {id1, id2} = req.params;
    const fromUser = await Users.findById(id1);
    const toUser = await Users.findById(id2);
    res.render("form", {fromUser, toUser});
});

app.put("/view/:id1/:id2", async(req, res) =>{
    const {id1, id2} = req.params;
    const credit = parseInt(req.body.credit);
    const fromUser = await Users.findById(id1);
    const toUser = await Users.findById(id2);

    if( credit != null &&  credit <= fromUser.credits && credit>0){
        
        let fromCreditsNew = fromUser.credits - credit;
        let toCreditsNew = parseInt(toUser.credits + credit);
        await Users.findByIdAndUpdate(id1, {credits : fromCreditsNew}, { runValidators: true, new: true });
        await Users.findByIdAndUpdate(id2, {credits : toCreditsNew}, { runValidators: true, new: true });

        let newTransaction = new Transactions();
        newTransaction.fromName = fromUser.name;
        newTransaction.toName = toUser.name;
        newTransaction.transfer = credit;
        await newTransaction.save();
        
        res.redirect("/sender");
    
    }
    else{
        res.render('error');
    }
});

app.get("/history", async(req, res)=>{
    const transactions = await Transactions.find({});
    res.render("history", {transactions});
});

app.listen(3000 || process.env.PORT, process.env.IP, ()=>{
    console.log("SERVER STARTED !");
});
