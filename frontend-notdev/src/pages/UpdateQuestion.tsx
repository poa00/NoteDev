import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import toast from "react-hot-toast";
import { RxCross2 } from "react-icons/rx";
import CodeEditor from "@/components-notdev/SecondaryCodeEditor";
import { fetchSingleQuesData, updateDSAQues } from "@/apis/quesApi";
import { useAuth } from "@/context/GoogleAuthContext";
type QuestionResponse = {
  title: string;
  description: string;
  difficulty: string;
  topicId: string;
  tag: string[];
  links: {
    leetcode: string;
    gfg: string;
    codeforces: string;
  };
  text: string;
  code: string;
  solutionLink: string;
  youtubeLink: string;
  images: string[];
};

const modules = {
  toolbar: [
    [{ font: [] }],
    [{ size: [] }],
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ script: "sub" }, { script: "super" }],
    ["link", "image"],
    [{ align: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "script",
  "list",
  "bullet",
  "indent",
  "direction",
  "align",
  "link",
  "image",
  "video",
  "blockquote",
  "code-block",
];
function QuestionForm() {
  const [activeTab, setActiveTab] = useState(1);
  const { id } = useParams();
  const [updating, setupdating] = useState(false);
  const [fetching, setfetching] = useState(false);
  const [formData, setFormData] = useState<QuestionResponse>({
    title: "",
    description: "",
    difficulty: "",
    topicId: "",
    tag: [],
    links: {
      leetcode: "",
      gfg: "",
      codeforces: "",
    },
    text: "",
    code: "",
    solutionLink: "",
    youtubeLink: "",
    images: [],
  });
  const { token, uid } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      setfetching(true);
      try {
        if (!id || !token) {
          return;
        }
        if (!uid) {
          return;
        }
        const response = await fetchSingleQuesData(id, token, uid);
        setFormData(response.data);

        setfetching(false);
      } catch (error: any) {
        if (error.message === "Request failed with status code 403") {
          toast.custom((_t) => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f9fc1e",
                color: "red",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                border: "1px solid #FFD700",
              }}
            >
              <span style={{ marginRight: "12px" }}>⚠️</span>
              <div>Dont try to be fishy!</div>
            </div>
          ));
          navigate("/");
        }
        setfetching(false);
        console.error("Error fetching data:", error);
      }
    };

    fetchData(); // Call the fetchData function
  }, [id, token]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  // //@ts-ignore
  // if (uid !== createdBy) {
  //   return (
  //     <div className="flex justify-center items-center h-[80%]">
  //       <h1 className="text-3xl font-bold text-red-500 bg-[#00000080] p-4 rounded-[16px]">
  //         Access Denied , Dont Try to be fishy
  //       </h1>
  //     </div>
  //   );
  // }

  const language = "javascript";

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      links: {
        ...prevData.links,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setupdating(true);
    try {
      if (!id || !token) {
        return;
      }
      if (!uid) {
        return;
      }
      updateDSAQues(formData, token, id, uid);
      toast.success("Form updated successfully");
      setupdating(false);

      window.history.back();
    } catch (error) {
      setupdating(false);

      toast.error("Failed to update form");
      console.error("Error:", error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const filePromises = fileArray.map((file) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            resolve(reader.result.toString());
          } else {
            reject(new Error("File reading failed"));
          }
        };
        reader.onerror = () => reject(new Error("File reading error"));
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then((base64Files) => {
        setFormData((prevData) => ({
          ...prevData,
          images: [...prevData.images, ...base64Files],
        }));
      })
      .catch((error) =>
        console.error("Error converting images to base64:", error)
      );
  };

  const handleImageDelete = (indexToDelete: number) => {
    setFormData((prevData) => ({
      ...prevData,
      images: prevData.images.filter((_, index) => index !== indexToDelete),
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleCodeChange = (newCode: string) => {
    setFormData((prevData) => ({
      ...prevData,
      code: newCode,
    }));
  };

  const handleTagChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      (e.target as HTMLInputElement).value.trim() !== ""
    ) {
      e.preventDefault(); // Prevent form submission
      const newTag = (e.target as HTMLInputElement).value.trim();
      setFormData((prevData) => ({
        ...prevData,
        tag: [...prevData.tag, newTag],
      }));
      (e.target as HTMLInputElement).value = "";
    }
  };

  const handleTagDelete = (index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      tag: prevData.tag.filter((_, i) => i !== index),
    }));
  };

  return (
    <>
      <div className="max-w-lg mx-auto p-6 ">
        <h2 className="text-2xl font-bold mb-4">Question Form</h2>
        <div className="tabs">
          <div className="flex space-x-4 mb-4 w-[400px] sm:w-full bg-red">
            <button
              className={`px-2 py-1 rounded ${
                activeTab === 1
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-800 text-white"
              }`}
              onClick={() => setActiveTab(1)}
            >
              Basic Info
            </button>
            <button
              className={`px-2 py-1 rounded ${
                activeTab === 2
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-800 text-white"
              }`}
              onClick={() => setActiveTab(2)}
            >
              Links
            </button>
            {/* <button
              className={`px-4 py-2 rounded ${
                activeTab === 3
                  ? "bg-gray-200 text-gray-900"
                  : "bg-gray-900 text-white"
              }`}
              onClick={() => setActiveTab(3)}
            >
              Content
            </button> */}
            <button
              className={`px-2 py-1 rounded ${
                activeTab === 4
                  ? "bg-gray-200 text-gray-800"
                  : "bg-gray-800 text-white"
              }`}
              onClick={() => setActiveTab(4)}
            >
              Notes
            </button>
            <button
              type="submit"
              className="bg-gradient-to-br from-blue-500 to-blue-800 hover:from-blue-800 hover:to-blue-500 transition-all rounded px-2 py-1"
              onClick={handleSubmit}
            >
              {fetching || updating ? (
                <span className="loading loading-dots loading-sm flex "></span>
              ) : (
                "Update"
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {activeTab === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="flex flex-col md:block">
                    Title:
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 w-[350px] sm:w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="flex flex-col md:block">
                    Description:
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 w-[350px] sm:w-full"
                    ></textarea>
                  </label>
                </div>
                <div>
                  <label className="flex flex-col md:block">
                    Difficulty:
                    <div className="flex space-x-4 bg-[#121212] h-[50px] border-[1px] border-white rounded-[6px] justify-evenly w-[350px] sm:w-full">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="difficulty"
                          value="easy"
                          checked={formData.difficulty === "easy"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span
                          className={`w-4 h-4 rounded-full cursor-pointer border border-gray-300 ${
                            formData.difficulty === "easy" ? "bg-green-500" : ""
                          }`}
                        ></span>
                        <span className="bg-green-700 px-2 py-1 rounded-[16px]">
                          Easy
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="difficulty"
                          value="medium"
                          checked={formData.difficulty === "medium"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span
                          className={`w-4 h-4 rounded-full cursor-pointer border border-gray-300 ${
                            formData.difficulty === "medium"
                              ? "bg-orange-500"
                              : ""
                          }`}
                        ></span>
                        <span className="bg-orange-500 px-2 py-1 rounded-[16px]">
                          Medium
                        </span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="difficulty"
                          value="hard"
                          checked={formData.difficulty === "hard"}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span
                          className={`w-4 h-4 rounded-full cursor-pointer border border-gray-300 ${
                            formData.difficulty === "hard" ? "bg-red-500" : ""
                          }`}
                        ></span>
                        <span className="bg-red-500 px-2 py-1 rounded-[16px]">
                          Hard
                        </span>
                      </label>
                    </div>
                  </label>
                </div>
                {/* <div>
                  <label className="block">
                    Topic ID:
                    <input
                      type="text"
                      name="topicId"
                      value={formData.topicId}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  </label>
                </div> */}
                <div>
                  <label className="flex flex-col md:block">
                    Tags:
                    <input
                      type="text"
                      name="tag"
                      onKeyDown={handleTagChange}
                      className="border border-gray-300 rounded p-2 w-[350px] sm:w-full"
                    />
                  </label>
                  <div className="mt-2 flex flex-wrap">
                    {formData.tag.map((tag, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-[#00000050] text-[#ffffff70] rounded-full px-3 py-1 mr-2 mb-2"
                      >
                        <p className="">{tag}</p>
                        <button
                          type="button"
                          className="ml-2"
                          onClick={() => handleTagDelete(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="flex flex-col md:block">
                    Leetcode Link:
                    <input
                      type="text"
                      name="leetcode"
                      value={formData.links.leetcode}
                      onChange={handleLinkChange}
                      className="border border-gray-300 rounded p-2 w-[350px] sm:w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="flex flex-col md:block">
                    GFG Link:
                    <input
                      type="text"
                      name="gfg"
                      value={formData.links.gfg}
                      onChange={handleLinkChange}
                      className="border border-gray-300 rounded p-2 w-[350px] sm:w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="flex flex-col md:block">
                    Codeforces Link:
                    <input
                      type="text"
                      name="codeforces"
                      value={formData.links.codeforces}
                      onChange={handleLinkChange}
                      className="border border-gray-300 rounded p-2 w-[350px] sm:w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="block">
                    Solution Link:
                    <input
                      type="text"
                      name="solutionLink"
                      value={formData.solutionLink}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="block">
                    YouTube Link:
                    <input
                      type="text"
                      name="youtubeLink"
                      value={formData.youtubeLink}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* {activeTab === 3 && (
              <div className="space-y-4">
                <label className="block">
                  Text:
                  <span>
                    <ReactQuill
                      value={formData.text}
                      onChange={(value) => handleInputChange("text", value)}
                      modules={modules}
                      formats={formats}
                      theme="snow"
                      className="w-[400px]"
                    />
                  </span>
                </label>

                <div>
                  <label className="block">
                    Code:
                    <div className="h-[400px]">
                      <MonacoEditor
                        language={language}
                        value={formData.code}
                        onChange={handleCodeChange}
                      />
                    </div>
                  </label>
                </div>
                <div>
                  <label className="block">
                    Solution Link:
                    <input
                      type="text"
                      name="solutionLink"
                      value={formData.solutionLink}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="block">
                    YouTube Link:
                    <input
                      type="text"
                      name="youtubeLink"
                      value={formData.youtubeLink}
                      onChange={handleChange}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  </label>
                </div>
                <div>
                  <label className="block">
                    Images:
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="border border-gray-300 rounded p-2 w-full"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="w-full h-32 flex justify-center items-center border border-gray-300 rounded overflow-hidden"
                    >
                      <img
                        src={image}
                        alt={`preview ${index}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            )} */}
          </form>
        </div>
      </div>

      {activeTab === 4 && (
        <>
          <span>
            <ReactQuill
              value={formData.text}
              onChange={(value) => handleInputChange("text", value)}
              modules={modules}
              formats={formats}
              theme="snow"
              className="w-[350px] md:w-[464px] m-auto bg-appbg"
            />
          </span>
          <div className="w-[350px] md:w-[464px] m-auto h-[330px]  my-[10px]">
            <label className="flex flex-col md:block">
              Code:
              <div className="w-[350px] md:w-[464px]  h-[300px] m-auto">
                <CodeEditor
                  language={language}
                  value={formData.code}
                  onChange={handleCodeChange}
                />
              </div>
            </label>
          </div>
          <div className="flex flex-col translate-y-[100px] mb-[200px]">
            <div className="w-[350px] md:w-[464px] mx-auto mt-4">
              <label className="flex flex-col md:block">
                Images:
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="border border-gray-300 rounded p-2 w-full"
                />
              </label>
            </div>

            <div className="w-[350px] md:w-[464px]  m-auto my-[20px]">
              <div className="grid grid-cols-5 gap-4 mt-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <div className="w-20 h-20 flex justify-center items-center border border-gray-300 rounded overflow-hidden">
                      <img
                        src={image}
                        alt={`preview ${index}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      className="absolute top-0 right-0 -mt-1 -mr-1 p-1 bg-red-500 text-black rounded-full text-xs hover:bg-red-600 focus:outline-none focus:bg-red-600 text-[30px] font-bold"
                      onClick={() => handleImageDelete(index)}
                    >
                      <RxCross2 />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default QuestionForm;
