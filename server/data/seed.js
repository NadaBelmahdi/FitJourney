export const seedData = {
  "questions": [
    {
      "id": "q1",
      "text": "Which architecture introduced the self-attention mechanism that revolutionized natural language processing?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Artificial Intelligence",
      "options": [
        "Convolutional Neural Networks",
        "Recurrent Neural Networks",
        "Transformers",
        "Generative Adversarial Networks"
      ],
      "correct": [
        2
      ],
      "explanation": "The Transformer architecture, introduced in the \"Attention Is All You Need\" paper by Google in 2017, relies entirely on self-attention mechanisms, dispensing with recurrence and convolutions."
    },
    {
      "id": "q2",
      "text": "In the context of Large Language Models (LLMs), what does \"Few-Shot Prompting\" refer to?",
      "type": "SCQ",
      "difficulty": "Easy",
      "category": "Artificial Intelligence",
      "options": [
        "Training the model on a few parameters",
        "Providing a few examples in the prompt to guide the model",
        "Generating short responses",
        "A technique to reduce model hallucinations"
      ],
      "correct": [
        1
      ],
      "explanation": "Few-shot prompting involves providing the model with a few examples (shots) within the prompt to demonstrate the desired task or format before asking it to perform the task."
    },
    {
      "id": "q3",
      "text": "Which of the following are common techniques used to prevent overfitting in Machine Learning models? (Select all that apply)",
      "type": "MCQ",
      "difficulty": "Medium",
      "category": "Machine Learning",
      "options": [
        "Cross-validation",
        "Adding more parameters to the model",
        "Regularization (L1/L2)",
        "Early stopping"
      ],
      "correct": [
        0,
        2,
        3
      ],
      "explanation": "Cross-validation, Regularization, and Early stopping are techniques to prevent overfitting. Adding more parameters generally increases the risk of overfitting by making the model more complex."
    },
    {
      "id": "q4",
      "text": "What is the primary purpose of a loss function (cost function) in Gradient Descent?",
      "type": "SCQ",
      "difficulty": "Easy",
      "category": "Machine Learning",
      "options": [
        "To initialize the weights of the neural network",
        "To measure how far the model's predictions are from the actual values",
        "To determine the learning rate automatically",
        "To activate the neurons in the output layer"
      ],
      "correct": [
        1
      ],
      "explanation": "A loss function quantifies the difference between the expected outcome and the outcome predicted by the model. Gradient descent seeks to minimize this loss."
    },
    {
      "id": "q5",
      "text": "Which activation function is widely used in hidden layers of Deep Neural Networks to introduce non-linearity while avoiding the vanishing gradient problem?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Deep Learning",
      "options": [
        "Sigmoid",
        "Tanh",
        "ReLU (Rectified Linear Unit)",
        "Softmax"
      ],
      "correct": [
        2
      ],
      "explanation": "ReLU (Rectified Linear Unit) is widely used because it does not suffer from the vanishing gradient problem for positive inputs, unlike Sigmoid and Tanh, allowing for deeper networks to be trained efficiently."
    },
    {
      "id": "q6",
      "text": "In a Convolutional Neural Network (CNN), what is the purpose of the Pooling layer?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Deep Learning",
      "options": [
        "To extract features like edges and textures",
        "To reduce the spatial dimensions of the input volume",
        "To convert the 2D output to a 1D vector",
        "To compute the final class probabilities"
      ],
      "correct": [
        1
      ],
      "explanation": "The pooling layer (e.g., Max Pooling) progressively reduces the spatial size of the representation to reduce the amount of parameters and computation in the network."
    },
    {
      "id": "q7",
      "text": "What will the following Python list comprehension produce? `[x**2 for x in range(5) if x % 2 != 0]`",
      "type": "SCQ",
      "difficulty": "Hard",
      "category": "Python Programming",
      "options": [
        "[1, 9]",
        "[0, 4, 16]",
        "[1, 3, 5, 7, 9]",
        "[1, 9, 25]"
      ],
      "correct": [
        0
      ],
      "explanation": "The range(5) produces 0, 1, 2, 3, 4. The condition `x % 2 != 0` filters for odd numbers (1, 3). The expression `x**2` squares them, resulting in [1, 9]."
    },
    {
      "id": "q8",
      "text": "Which Python features are fundamentally based on the concept of iterators and `yield`?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Python Programming",
      "options": [
        "Decorators",
        "Generators",
        "Context Managers",
        "Metaclasses"
      ],
      "correct": [
        1
      ],
      "explanation": "Generators use the `yield` keyword to return an iterator that produces a sequence of values lazily (one at a time) rather than storing them all in memory at once."
    },
    {
      "id": "q9",
      "text": "Which HTTP method is designed to be idempotent and used to replace an entire resource?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Web Development",
      "options": [
        "POST",
        "PATCH",
        "PUT",
        "UPDATE"
      ],
      "correct": [
        2
      ],
      "explanation": "The PUT method requests that the enclosed entity be stored under the supplied URI. If the URI refers to an existing resource, it is completely replaced. It is idempotent (multiple identical requests have the same effect as a single one)."
    },
    {
      "id": "q10",
      "text": "According to CSS specificity rules, which selector has the highest weight?",
      "type": "SCQ",
      "difficulty": "Easy",
      "category": "Web Development",
      "options": [
        "A class selector (.class)",
        "An ID selector (#id)",
        "An inline style attribute (style=\"...\")",
        "An element selector (div)"
      ],
      "correct": [
        2
      ],
      "explanation": "Inline styles have the highest specificity (1, 0, 0, 0), followed by IDs (0, 1, 0, 0), classes/attributes/pseudo-classes (0, 0, 1, 0), and elements/pseudo-elements (0, 0, 0, 1)."
    },
    {
      "id": "q11",
      "text": "What is the most effective defense against SQL Injection attacks?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Cybersecurity",
      "options": [
        "Using Complex Passwords",
        "Base64 encoding all inputs",
        "Using Prepared Statements (Parameterized Queries)",
        "Implementing a Web Application Firewall (WAF)"
      ],
      "correct": [
        2
      ],
      "explanation": "Prepared statements ensure that the database treats user input strictly as data/parameters, not as executable SQL code, completely neutralizing SQL injection attempts."
    },
    {
      "id": "q12",
      "text": "Which of the following are true about cryptographic hash functions? (Select all that apply)",
      "type": "MCQ",
      "difficulty": "Hard",
      "category": "Cybersecurity",
      "options": [
        "They are reversible with the right key",
        "They produce a fixed-size output regardless of input size",
        "A small change in input drastically changes the output (Avalanche effect)",
        "They are primarily used for encrypting data in transit"
      ],
      "correct": [
        1,
        2
      ],
      "explanation": "Hash functions are one-way (irreversible), produce fixed-size outputs, and exhibit the avalanche effect. Encryption is reversible and used for data in transit; hashing is used for integrity and password storage."
    },
    {
      "id": "q13",
      "text": "In the context of Cloud computing and AWS, what does S3 stand for?",
      "type": "SCQ",
      "difficulty": "Easy",
      "category": "Cloud & DevOps",
      "options": [
        "Simple Storage Service",
        "Scalable Server System",
        "Standard SQL Server",
        "Secure Socket Shell"
      ],
      "correct": [
        0
      ],
      "explanation": "Amazon S3 stands for Simple Storage Service, an object storage service offering industry-leading scalability, data availability, security, and performance."
    },
    {
      "id": "q14",
      "text": "What is the primary role of a container orchestration system like Kubernetes?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Cloud & DevOps",
      "options": [
        "To write the code for microservices",
        "To automatically deploy, scale, and manage containerized applications",
        "To act as a hypervisor for Virtual Machines",
        "To serve as a continuous integration pipeline"
      ],
      "correct": [
        1
      ],
      "explanation": "Kubernetes is designed to automate deploying, scaling, and operating application containers across clusters of hosts."
    },
    {
      "id": "q15",
      "text": "In pandas (Python Data Science library), which method is used to compute a simple cross-tabulation of two (or more) factors?",
      "type": "SCQ",
      "difficulty": "Hard",
      "category": "Data Science",
      "options": [
        "pd.pivot_table()",
        "pd.crosstab()",
        "pd.groupby()",
        "pd.merge()"
      ],
      "correct": [
        1
      ],
      "explanation": "While `pivot_table` can be used, `pd.crosstab()` is specifically designed to compute a simple cross-tabulation of two (or more) factors, by default computing a frequency table of the factors."
    },
    {
      "id": "q16",
      "text": "When dealing with missing data in a dataset, which of the following is an imputation technique?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Data Science",
      "options": [
        "Dropping all rows with null values",
        "Normalizing the data",
        "Replacing null values with the mean or median of the column",
        "Converting categorical variables to dummy variables"
      ],
      "correct": [
        2
      ],
      "explanation": "Imputation involves replacing missing data with substituted values, such as the mean, median, or mode of the respective feature column."
    },
    {
      "id": "q17",
      "text": "Which of the following AWS services is best suited for running Docker containers without managing the underlying EC2 instances?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Cloud & DevOps",
      "options": [
        "AWS Lambda",
        "Amazon EC2",
        "AWS Fargate",
        "Amazon S3"
      ],
      "correct": [
        2
      ],
      "explanation": "AWS Fargate is a serverless compute engine for containers that works with both Amazon Elastic Container Service (ECS) and Amazon Elastic Kubernetes Service (EKS)."
    },
    {
      "id": "q18",
      "text": "What type of vulnerability occurs when a web application includes untrusted data in a web page without proper validation or escaping?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Cybersecurity",
      "options": [
        "Cross-Site Scripting (XSS)",
        "Cross-Site Request Forgery (CSRF)",
        "SQL Injection",
        "Man-in-the-Middle (MitM)"
      ],
      "correct": [
        0
      ],
      "explanation": "Cross-Site Scripting (XSS) occurs when malicious scripts are injected into otherwise benign and trusted websites, allowing attackers to execute scripts in the victim's browser."
    },
    {
      "id": "q19",
      "text": "Which HTTP status code is returned when the client must authenticate itself to get the requested response?",
      "type": "SCQ",
      "difficulty": "Easy",
      "category": "Web Development",
      "options": [
        "200 OK",
        "401 Unauthorized",
        "403 Forbidden",
        "404 Not Found"
      ],
      "correct": [
        1
      ],
      "explanation": "The 401 Unauthorized client error status response code indicates that the request has not been applied because it lacks valid authentication credentials for the target resource."
    },
    {
      "id": "q20",
      "text": "What does a Python decorator fundamentally do?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Python Programming",
      "options": [
        "It changes the styling of the printed output",
        "It allows you to wrap another function in order to extend the behavior of the wrapped function",
        "It declares variables with strong static types",
        "It optimizes the execution speed of loops"
      ],
      "correct": [
        1
      ],
      "explanation": "A decorator takes in a function, adds some functionality, and returns it. This is typically used to extend the behavior of the wrapped function without permanently modifying it."
    },
    {
      "id": "q21",
      "text": "In the Backpropagation algorithm, what calculus concept is heavily relied upon to compute the gradients of the loss function with respect to the network weights?",
      "type": "SCQ",
      "difficulty": "Hard",
      "category": "Deep Learning",
      "options": [
        "Integration by parts",
        "Taylor Series expansion",
        "The Chain Rule",
        "L'Hôpital's Rule"
      ],
      "correct": [
        2
      ],
      "explanation": "Backpropagation calculates the gradient of the loss function with respect to each weight by applying the chain rule of calculus backwards from the output layer to the input layer."
    },
    {
      "id": "q22",
      "text": "Which of the following evaluation metrics would be MOST appropriate for an imbalanced classification problem (e.g., fraud detection)?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Machine Learning",
      "options": [
        "Accuracy",
        "Mean Squared Error (MSE)",
        "F1-Score",
        "R-squared"
      ],
      "correct": [
        2
      ],
      "explanation": "Accuracy can be misleading for imbalanced datasets (predicting all negative gives 99% accuracy if 99% of data is negative). F1-Score, the harmonic mean of precision and recall, is much better for assessing performance on imbalanced data."
    },
    {
      "id": "q23",
      "text": "What does the term \"Prompt Injection\" mean in the context of Large Language Models?",
      "type": "SCQ",
      "difficulty": "Medium",
      "category": "Artificial Intelligence",
      "options": [
        "Injecting more training data into the model",
        "A technique where an attacker crafts an input designed to override the model's original instructions",
        "Automated fine-tuning using prompts",
        "Using SQL commands to query the model"
      ],
      "correct": [
        1
      ],
      "explanation": "Prompt injection is a security vulnerability where a user uses crafted inputs to manipulate an LLM into ignoring its previous instructions and executing malicious or unintended commands."
    },
    {
      "id": "q24",
      "text": "Which NumPy function is commonly used to calculate the dot product of two arrays?",
      "type": "SCQ",
      "difficulty": "Easy",
      "category": "Data Science",
      "options": [
        "np.cross()",
        "np.sum()",
        "np.dot()",
        "np.multiply()"
      ],
      "correct": [
        2
      ],
      "explanation": "np.dot() is the standard function used in NumPy to compute the dot product of two arrays, which is heavily used in linear algebra operations."
    },
    {
      "id": "q25",
      "text": "Continuous Integration / Continuous Deployment (CI/CD) pipelines are designed to automate which of the following? (Select all that apply)",
      "type": "MCQ",
      "difficulty": "Medium",
      "category": "Cloud & DevOps",
      "options": [
        "Code building and compilation",
        "Automated testing",
        "Writing new feature code",
        "Deploying applications to production environments"
      ],
      "correct": [
        0,
        1,
        3
      ],
      "explanation": "CI/CD pipelines automate the building, testing, and deployment of software to ensure reliable and rapid release cycles. They do not write the code itself."
    }
  ],
  "settings": {
    "numQuestions": 15,
    "hintsEnabled": true,
    "timeLimit": 0,
    "passingScore": 60,
    "recommendationThreshold": 70
  },
  "attempts": [],
  "qStats": {},
  "users": [],
  "phoneOtps": []
};
