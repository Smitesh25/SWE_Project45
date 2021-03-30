#!/usr/bin/env python
# coding: utf-8

# In[110]:


import numpy as np
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import MinMaxScaler
import time
import sys
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.naive_bayes import GaussianNB
from yellowbrick.classifier import ClassificationReport


# In[111]:


def select_data(x):
    df = pd.read_csv(x)
    scaler = MinMaxScaler()
    df.iloc[:,0:df.shape[1]-1] = scaler.fit_transform(df.iloc[:,0:df.shape[1]-1])
    return df

df=select_data(sys.argv[1])
X = df.iloc[:, :-1].values
y = df.iloc[:, -1].values

start = time.time()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size = 0.25, random_state = 0)

classifier=RandomForestClassifier(n_estimators=350, criterion='entropy', random_state=0)
classifier.fit(X_train, y_train)

y_pred=classifier.predict(X_test)
elapsed = (time.time() - start)
print("Accuracy of classifying the dataset is " , end="")
print(100*(round(accuracy_score(y_test, y_pred), 4)))
print("Time taken to classify the dataset is ", end="")
print(round(elapsed, 4))

classes=["0", "1"]
model=RandomForestClassifier()
visualizer = ClassificationReport(model, classes=classes, support=True)
visualizer.fit(X_train, y_train)        
visualizer.score(X_test, y_test)        
visualizer.show(outpath="class.png")   
