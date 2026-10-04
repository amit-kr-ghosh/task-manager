import React, { useEffect } from "react";
import { FaHandPointRight } from "react-icons/fa";
import axios from "axios";

const MainTask = ({ tasks, setTasks }) => {
  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/task/getTask`)
      .then((res) => {
        setTasks(res.data);
      })
      .catch((err) => console.log(err));
  }, [setTasks]);

  return (
    <div className="scroller">
      <div className="content-task scroller-inner">
        <div className="scroller-con">
          <div className="dots">
            <p id="one"></p>
            <p id="two"></p>
            <p id="three"></p>
          </div>
          <span id="scroller-con-col">" Master Your Day With Tasks."</span>
          <br />
          <br />
          Revoloutionize your productivity journey with our Task Manager.
        </div>

        <div className="scroller-con">
          <div className="dots">
            <p id="one"></p>
            <p id="two"></p>
            <p id="three"></p>
          </div>
          <span id="scroller-con-col">Elevate your productivity game - it's time to take charge!</span>
          <br />
          <br />
          Some of your upcoming Tasks ...
          <br />
          <FaHandPointRight size={30} style={{ marginLeft: "50%" }} />
        </div>
        {tasks.map((eachTask) => (
          <div id="dash-task-con" key={eachTask.id}>
            <h4>Task Name : {eachTask.task.taskName}</h4>
            <h4>Priority : {eachTask.task.priority}</h4>
            <h4>Deadline : {eachTask.task.deadline}</h4>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainTask;
