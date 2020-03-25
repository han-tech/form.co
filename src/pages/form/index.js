import React from 'react';
import PropTypes from 'prop-types';
import { Route, Redirect } from 'react-router-dom';

import Form from '../../containers/Form';

const FormPage = ({ uid, signIn }) => {
  return (
    <Route
      render={({ location }) => {
        return (
          <div>
            <Route exact path="/form/" render={() => <Redirect to="/" />} />
            <Route
              location={location}
              key={location.key}
              path="/form/:formId/"
              render={props => <Form {...props} uid={uid} signIn={signIn} />}
            />
          </div>
        );
      }}
    />
  );
};

FormPage.propTypes = {
  uid: PropTypes.string,
  signIn: PropTypes.func.isRequired,
};

export default FormPage;
