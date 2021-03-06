import React, { Component } from 'react';
import PropTypes from 'prop-types';

import Form from '../components/Form/index';

class FormContainer extends Component {
  static contextTypes = {
    firebase: PropTypes.object,
  };

  static propTypes = {
    match: PropTypes.object.isRequired,
    history: PropTypes.object.isRequired,
    uid: PropTypes.string,
    signIn: PropTypes.func.isRequired,
  };

  state = {
    title: '',
    // fields is a map with the fieldId as the keys and
    // field data including results as the values
    fields: {},
    loading: false,
    selection: '',
    hasVoted: false,
  };

  // pull the formId from the route param, then fetch the form
  componentDidMount() {
    const { history, match, uid } = this.props;

    if (match.params.formId.length === 6) {
      if (uid) {
        this.checkVote(uid);
      }

      this.setState({
        loading: true,
      });

      this.form
        .get()
        .then(doc => {
          if (doc.exists) {
            const { title, fields } = doc.data();

            this.setState({
              loading: false,
              title,
              fields: fields.reduce((aggr, curr) => {
                return {
                  ...aggr,
                  [curr.fieldId]: {
                    ...curr,
                    votes: 0,
                  },
                };
              }, {}),
            });
          } else {
            history.push('/404');
          }
        })
        .catch(error => {
          // eslint-disable-next-line no-console
          console.error(error);
          // TODO: notify the user of the error
        });
    } else {
      history.push('/404');
    }
  }

  // since we don't know when the user will be authenticated if ever,
  // we need to add checks here and sign in anonymously if not
  componentWillReceiveProps(nextProps) {
    const { uid } = this.props;
    const { uid: nextUid } = nextProps;

    if ((!uid && !nextUid) || (uid && !nextUid)) {
      this.signInAnonymously();
    } else {
      // a uid exists, check if the user has already voted
      this.checkVote(nextUid);
    }
  }

  componentWillUnmount() {
    if (this.stopResultListener) {
      this.stopResultListener();
    }
  }

  get form() {
    const { firebase } = this.context;
    const { match } = this.props;

    return firebase.forms.doc(match.params.formId);
  }

  get results() {
    // get the results sub-collection on the form document
    return this.form.collection('results');
  }

  handleSelectOption = id => {
    this.setState({
      selection: id,
    });
  };

  handleVote = () => {
    const { uid } = this.props;
    const { selection } = this.state;
    const vote = uid => {
      this.setState({
        loading: true,
      });

      // store the users vote in a sub-collection
      this.results
        .doc(uid)
        .set({
          fieldsId: selection,
          uid,
        })
        .then(() => {
          this.setState({
            loading: false,
            hasVoted: true,
          });

          this.startResultListener();
        });
    };
    // in the case a user votes and they've not been logged in
    if (!uid) {
      this.signInAnonymously().then(({ uid }) => {
        vote(uid);
      });
    } else {
      vote(uid);
    }
  };

  signInAnonymously() {
    const { signIn } = this.props;

    return signIn('anonymous').catch(error => {
      // eslint-disable-next-line no-console
      console.error(error);
      // TODO: notify the user of the error
    });
  }

  checkVote(uid) {
    this.results
      .doc(uid)
      .get()
      .then(resultDoc => {
        if (resultDoc.exists) {
          const { fieldsId } = resultDoc.data();

          this.setState({
            selection: fieldsId,
            hasVoted: true,
          });

          // start listening to result changes since there
          // user has voted.
          this.startResultListener();
        }
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error(error);
        // TODO: notify the user of the error
      });
  }

  startResultListener() {
    // set an unsubscribe reference on the instance, so that
    // we can stop listening when the component unmounts
    this.stopResultListener = this.results.onSnapshot(
      snapshot => {
        snapshot.docChanges().forEach(change => {
          const { fieldId } = change.doc.data();

          if (change.type === 'added') {
            this.setState(prevState => {
              return {
                ...prevState,
                fields: {
                  ...prevState.fields,
                  [fieldId]: {
                    ...prevState.fields[fieldId],
                    votes: prevState.fields[fieldId].votes + 1,
                  },
                },
              };
            });
          }
          if (change.type === 'removed') {
            // currently there's no way of changing a user's vote after it
            // has been saved. We could accomplish this by deleting the
            // user's uid document on the results sub-collection. This
            // is where we'd remove the vote from the UI when that'd happen.
          }
        });
      },
      error => {
        // eslint-disable-next-line no-console
        console.error(error);
        // TODO: notify the user of the error
      },
    );
  }

  render() {
    return (
      <Form
        {...this.state}
        onSelectField={this.handleSelectField}
        onVote={this.handleVote}
      />
    );
  }
}

export default FormContainer;
