import React, { useEffect, useState, useRef } from "react";

import { BiSolidSave, BiEdit } from "react-icons/bi";

import { AiFillDelete } from "react-icons/ai";

import Dialog from "./SrNoDialog/Dialog";

import axios from "axios";

import Aos from "aos";
import "aos/dist/aos.css";

const Note = (props) => {
  const { val, notes, setNotes, toast } = props;

  const [dialog, setDialog] = useState({
    isLoading: false,
  });

  const [text, setText] = useState(val.noteText);

  const textareaRef = useRef();
  const idRef = useRef();

  useEffect(() => {
    Aos.init({
      duration: 600,
    });
  }, []);

  // ----------------------------------------------------
  // DELETE NOTE
  // ----------------------------------------------------

  const deleteNote = (id) => {
    setDialog({
      isLoading: true,
    });

    idRef.current = id;
  };

  const areYouSure = async (yes) => {
    if (!yes) {
      setDialog({
        isLoading: false,
      });

      return;
    }

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/note/deleteNote/${idRef.current}`,
        {
          withCredentials: true,
        },
      );

      setNotes(notes.filter((note) => idRef.current !== note.id));

      setDialog({
        isLoading: false,
      });

      toast.success("Deleted Successfully");
    } catch (err) {
      console.error("Delete note error:", err);

      setDialog({
        isLoading: false,
      });

      toast.error("Failed to delete note");
    }
  };

  // ----------------------------------------------------
  // SAVE NOTE
  // ----------------------------------------------------

  const saveNote = async (id) => {
    try {
      const note = notes.find((obj) => obj.id === id);

      if (!note) {
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/note/getNote`,
        {
          withCredentials: true,
        },
      );

      const found = response.data.find((obj) => obj.id === id);

      if (!found) {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/note/postNote`,
          note,
          {
            withCredentials: true,
          },
        );
      }

      await update(id);
    } catch (err) {
      console.error("Save note error:", err);

      toast.error("Failed to save note");
    }
  };

  // ----------------------------------------------------
  // UPDATE NOTE
  // ----------------------------------------------------

  const update = async (id) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/note/updateNote/${id}`,
        {
          newText: text,
        },
        {
          withCredentials: true,
        },
      );

      toast.success("Saved Successfully");
    } catch (err) {
      console.error("Update note error:", err);

      toast.error("Failed to update note");
    }
  };

  // ----------------------------------------------------
  // TYPING
  // ----------------------------------------------------

  const typing = (e) => {
    setText(e.target.value);
  };

  // ----------------------------------------------------
  // FOCUS EDIT BUTTON
  // ----------------------------------------------------

  const focusBtn = () => {
    textareaRef.current?.focus();
  };

  // ----------------------------------------------------
  // AI AUTOCOMPLETE
  // ----------------------------------------------------

  const handleAutocomplete = async () => {
    let loadingToast;

    try {
      const cleanText = text?.trim();

      if (!cleanText) {
        toast.error("Type something first");

        return;
      }

      loadingToast = toast.loading("Generating AI suggestion...");

      // IMPORTANT:
      // The browser calls OUR backend.
      // The Cohere API key is stored on Render.
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/ai/autocomplete`,
        {
          text: cleanText,
        },
        {
          withCredentials: true,
        },
      );

      const suggestion = response.data.suggestion;

      if (!suggestion) {
        toast.dismiss(loadingToast);

        toast.error("No response from AI");

        return;
      }

      setText(suggestion);

      toast.dismiss(loadingToast);

      toast.success("AI suggestion added!");
    } catch (err) {
      console.error("AI autocomplete error:", err);

      if (loadingToast) {
        toast.dismiss(loadingToast);
      }

      toast.error(
        err.response?.data?.error || "Failed to generate AI suggestion",
      );
    }
  };

  // ----------------------------------------------------
  // CTRL + SPACE
  // ----------------------------------------------------

  const handleKeyDown = (e) => {
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();

      handleAutocomplete();
    }
  };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  return (
    <>
      <div className="note-body">
        {dialog.isLoading && <Dialog areYouSure={areYouSure} />}

        <div className="note-head">
          <button className="note-bt" onClick={() => saveNote(val.id)}>
            <BiSolidSave color="#f7efe5" size={20} />
          </button>

          <button className="note-bt" onClick={focusBtn}>
            <BiEdit color="#f7efe5" size={20} />
          </button>

          <button onClick={() => deleteNote(val.id)} className="note-bt">
            <AiFillDelete color="#f7efe5" size={20} />
          </button>
        </div>

        <h3 id="note-title">{val.title}</h3>

        <textarea
          ref={textareaRef}
          value={text}
          spellCheck="false"
          onChange={typing}
          onKeyDown={handleKeyDown}
          onFocus={(event) =>
            event.currentTarget.setSelectionRange(
              event.currentTarget.value.length,
              event.currentTarget.value.length,
            )
          }
          placeholder="Type your note and press Ctrl + Space for AI suggestion"
          className="note-textarea"
        />

        <div className="note-foot">
          <h3 className="date">{val.date}</h3>

          <h3 className="time">{val.time}</h3>
        </div>
      </div>
    </>
  );
};

export default Note;
