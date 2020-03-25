import firebase from 'firebase';
import 'firebase/firestore';

var config = {
  apiKey: process.env.GATSBY_apiKey,
  authDomain: process.env.GATSBY_authDomain,
  databaseURL: process.env.GATSBY_databaseURL,
  projectId: process.env.GATSBY_projectId,
  storageBucket: process.env.GATSBY_storageBucket,
  messagingSenderId: process.env.GATSBY_messagingSenderId,
};

console.log(process.env);
class Firebase {
  constructor() {
    firebase.initializeApp(config);
    this.store = firebase.firestore;
    this.auth = firebase.auth;
  }

  get forms() {
    return this.store().collection('forms');
  }
}

export default new Firebase();
