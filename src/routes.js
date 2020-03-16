import React from "react";

import { BrowserRouter, Switch, Route } from "react-router-dom";

import Home from "./pages/Home";
import Create from "./pages/Create";
import List from "./pages/List";
import Delete from "./pages/Delete";
import About from "./pages/About";

const Routes = () => (
  <BrowserRouter>
    <Switch>
      <Route exact path="/" component={Home} />
      <Route path="/create" component={Create} />
      <Route path="/list" component={List} />
      <Route path="/delete" component={Delete} />
      <Route path="/about" component={About} />
    </Switch>
  </BrowserRouter>
);

export default Routes;
