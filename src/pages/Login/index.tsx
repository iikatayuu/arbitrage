
import React from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';
import axios from 'axios';

import './style.scss';

interface LoginWrapProps {}

interface LoginProps extends LoginWrapProps {
  navigate: NavigateFunction;
}

interface LoginState {
  username: string;
  password: string;
  error: string;
  loggingin: boolean;
}

class Login extends React.Component<LoginProps, LoginState> {
  constructor (props: LoginProps) {
    super(props);

    this.state = {
      username: '',
      password: '',
      error: '',
      loggingin: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange (event: React.ChangeEvent) {
    const target = event.target as HTMLInputElement;
    const state = this.state as any;
    const name = target.name;
    const value = target.value;
    state[name] = value;
    this.setState(state);
  }

  async handleSubmit (event: React.FormEvent) {
    event.preventDefault();

    this.setState({
      error: '',
      loggingin: true
    });

    const form = event.target as HTMLFormElement;
    const username = this.state.username;
    const password = this.state.password;
    try {
      const res = await axios.post(form.action, { username, password });
      if (res.data.success) {
        sessionStorage.setItem('token', res.data.token);
        this.props.navigate('/dashboard');
      } else {
        this.setState({ error: res.data.message });
      }
    } catch (error) {
      this.setState({ error: 'Unable to send request' });
    }

    this.setState({ loggingin: false });
  }

  render () {
    const backend = process.env.REACT_APP_BACKEND_API;
    return (
      <form action={`${backend}/api/login`} method="post" className="login-form py-5 px-4" onSubmit={this.handleSubmit}>
        <h4 className="mb-2">Admin Log In</h4>
        <div className="form-group mb-3">
          <label htmlFor="login-username">Username:</label>
          <input type="text" id="login-username" name="username" value={this.state.username} className="form-control" onChange={this.handleChange} />
        </div>

        <div className="form-group mb-3">
          <label htmlFor="login-password">Password:</label>
          <input type="password" id="login-password" name="password" value={this.state.password} className="form-control" onChange={this.handleChange} />
        </div>

        {
          this.state.error !== '' &&
          <div className="alert alert-error mb-3">
            { this.state.error }
          </div>
        }


        <button type="submit" className="btn btn-primary btn-block" disabled={this.state.loggingin}>Log In</button>
      </form>
    );
  }
}

export default function LoginWrap (props: LoginWrapProps) {
  const navigate = useNavigate();
  return <Login navigate={navigate} />;
}
