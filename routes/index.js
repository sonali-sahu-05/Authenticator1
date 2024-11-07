var express = require('express');
var router = express.Router();
const nodemailer = require("nodemailer");

const USER = require("../models/userModels")
const Post = require("../models/postModel")
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(USER.authenticate()));



/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { admin: req.user });
});

router.get('/signup', function (req, res, next) {
  res.render('signup', { admin: req.user });
});

router.get('/about', function (req, res, next) {
  res.render('about', { admin: req.user });
});



router.post('/signup', async function (req, res, next) {

  try {
    await USER.register(
      { username: req.body.username, email: req.body.email },
      req.body.password
    );
    res.redirect("/signin");
  } catch (error) {
    console.log(error);
    res.send(error);
  }

});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/signin");
  }
}

router.get('/signin', function (req, res, next) {
  res.render('login', { admin: req.user });
});

router.post(
  "/signin",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/signin",
  }),
  function (req, res, next) { }
)

router.get("/signout", isLoggedIn, function (req, res, next) {
  req.logout(() => {
    res.redirect("/signin");
  });
});

// Read the database
router.get('/profile', isLoggedIn, async function (req, res, next) {
  try {
    // const Users = await USER.find();
    // res.render('profile', { Users: Users, admin: req.user });
    const user = await req.user.populate("posts");
    console.log(user.posts);
    res.render("profile", { admin: req.user, posts: user.posts });

  } catch (error) {
    res.send(error)
    console.log(error)
  }
});

router.get('/delete/:id', isLoggedIn, async function (req, res, next) {
  try {
    await USER.findByIdAndDelete(req.params.id)
    res.redirect("/profile")
  } catch (error) {
    res.send(error)
  }
});

router.get('/update/:id', isLoggedIn, async function (req, res, next) {
  try {
    const user = await USER.findById(req.params.id)
    res.render("update", { user: user, admin: req.user });
  } catch (error) {
    res.send(error)
  }
});

router.post('/update/:id', isLoggedIn, async function (req, res, next) {
  try {
    await USER.findByIdAndUpdate(req.params.id, req.body);
    res.redirect("/profile");
  } catch (error) {
    res.send(error)
  }
});

router.post('/search', isLoggedIn, async function (req, res, next) {
  try {
    const User = await USER.findOne({ username: req.body.username })
  } catch (error) {
    res.send(error)
  }
});

router.get('/forget', function (req, res, next) {
  res.render('forget', { admin: req.user });
})

router.post('/send-mail', async function (req, res, next) {
  // console.log(req.body.email)
  try {
    const user = await USER.findOne({ email: req.body.email })
    console.log(user)
    if (!user) return res.send("USer Not Found")


    sendmailhandler(req, user, res)
  } catch (error) {
    res.send(error)
  }

});

function sendmailhandler(req, user, res) {
  const otp = Math.floor(1000 + Math.random() * 9000);
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: "rohitbanna101@gmail.com",
      pass: "luav lryv poxu bcht",
    },
  });
  // receiver mailing info
  const mailOptions = {
    from: "Devloper_pvt.limited<rohitbanna101@gmail.com>",
    to: user.email,
    subject: "Testing Mail Service",
    // text: req.body.message,
    html: `<h1>Your OTP iS ${otp} </h1>`,
  };

  transport.sendMail(mailOptions, (err, info) => {
    if (err) return res.send(err);
    // console.log(info);
    user.resetPasswordOtp = otp;
    user.save();
    res.render("otp", { admin: req.user, email: user.email });
    // console.log(info);

  });
}

router.post('/match-otp/:email', async function (req, res, next) {
  try {
    const user = await USER.findOne({ email: req.params.email });
    if (user.resetPasswordOtp = req.body.otp) {
      user.resetPasswordOtp = -1;
      await user.save();
      res.render("Resetpassword", { admin: req.user, id: user._id })
    } else {
      res.send(
        "Invalid OTP, Try Again <a href='/forget'>Forget Password</a>"
      );
    }
  } catch (error) {
    res.send(error)
  }
});

router.post('/resetpassword/:id', async function (req, res, next) {
  try {
    const user = await USER.findById(req.params.id);
    changepassword = await user.setPassword(req.body.password)
    await user.save(changepassword)
    res.redirect("/signin")
  } catch (error) {
    res.send(error)
  }
});

router.get('/reset', function (req, res, next) {
  res.render('reset', { admin: req.user });
});

router.post('/reset', async function (req, res, next) {
  try {
    changepassword = await req.user.changePassword(
      req.body.oldpassword,
      req.body.newpassword
    )
    await req.user.save(changepassword);
    res.redirect("/profile");
  } catch (error) {
    res.send(error)
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/signin");
  }
}

// .....................................................................................................

router.get('/createpost', isLoggedIn, function (req, res, next) {
  res.render('createpost', { admin: req.user });
});

router.post('/createpost', isLoggedIn, async function (req, res, next) {
  try {
    const post = new Post(req.body);
    req.user.posts.push(post._id)
    post.User = req.user._id;
    // res.json(post);
    await post.save();
    await req.user.save();
    res.redirect("/profile");
  } catch (error) {
    res.send(error)
    console.log(error)
  }
});

// router.get('/deletepost/:id', isLoggedIn, async function (req, res, next) {
//   indexpost=in
// });



module.exports = router;
