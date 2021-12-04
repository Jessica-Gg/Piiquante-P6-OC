const Sauce = require('../models/sauces');
const fs = require('fs');
const { response } = require('express');

//Afficher toutes les sauces
exports.getAllSauce = (req, res, next) => {
  Sauce.find()
    .then(sauce => {
      res.status(200).json(sauce);
    })
    .catch(error => {
      res.status(400).json({error: error});
    });
};

//Afficher une sauce
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({_id: req.params.id})
    .then(sauce => {
      res.status(200).json(sauce);
      })
    .catch(error => {
      res.status(404).json({
        error: error
      });
    });
};

//Créer une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  const newSauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });
    newSauce.save()
      .then(() => res.status(201).json({ message: 'Sauce enregistrée !'}))
      .catch(error => res.status(400).json({error}));
};

//Modifier une sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
      .catch(error => res.status(400).json({error}));
};

//Supprimer une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(Sauce => {
      const filename = Sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => res.status(200).json({message: 'Sauce supprimée !'}))
            .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({error}));
};


//Gestion des likes et dislikes
exports.rateSauce = (req, res, next) => {
  let like = req.body.like
  let userId = req.body.userId
  let sauceId = req.params.id

  //Liker une sauce
  if (like === 1) {
    //On récupère la sauce par son id
    Sauce.updateOne({_id: sauceId},
      {
        //On ajoute l'id de l'utilisateur dans le tableau de ceux ayant liké la sauce et on incrémente le nombre de likes de 1
        $push: {usersLiked : userId},
        $inc: {likes : +1}
      })
      .then(()=> res.status(200).json({message: 'Vous avez aimé cette sauce !'}))
      .catch((error) => res.status(400).json({error}))
  }

  //Disliker une sauce
  if (like === -1) {
    //On récupère la sauce par son id
    Sauce.updateOne({_id: sauceId}, 
      {
      //On ajoute l'id de l'utilisateur dans le tableau de ceux ayant disliké la sauce et on incrémente le nombre de dislikes de 1
        $push: {usersDisliked: userId},
        $inc: {dislikes: +1}
      })
      .then(() => res.status(200).json({message: 'Vous n \'avez pas aimé cette sauce !'}))
      .catch((error) => res.status(400).json({error}))
  }

  //Annulation d'un like ou d'un dislike
  //On récupère la sauce avec son id
  if (like === 0) {
    Sauce.findOne({ _id: sauceId})
      .then((sauce) => {
      //Annulation du like : si  le user a déjà liké la sauce, on le retire du tableau des users ayant liké la sauce et on décrémente le nombre de likes de 1
          if (sauce.usersLiked.includes(userId)) {
              Sauce.updateOne({_id: sauceId}, 
                  {
                      $pull: {usersLiked: userId},
                      $inc: {likes: -1}
                  })
                  .then(() => res.status(200).json({message: 'Votre like a été annulé'}))
                  .catch((error) => res.status(400).json({error}));
          }

      //Annulation du dislike : si le user a déjà disliké la sauce, on le retire du tableau des users ayant disliké la sauce et on décrémente le nombre de likes de 1
          if (sauce.usersDisliked.includes(userId)) {
              Sauce.updateOne({_id: sauceId},
                  {
                  $pull: {usersDisliked: userId},
                  $inc: {dislikes: -1}
                  })
                  .then(() => res.status(200).json({message: 'Votre dislike a été annulé'}))
                  .catch((error) => res.status(400).json({error}));
          }
      })
      .catch((error) => res.status(400).json({error}));
  }
};