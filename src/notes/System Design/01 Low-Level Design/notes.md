# Low-Level Design (LLD) Notes

These notes cover the basic concepts used in **Low-Level Design (LLD)**,
especially **design patterns, UML, SOLID principles, relationships,
abstraction, encapsulation, and inheritance**.

The main idea of LLD is to design classes and their interactions in a
way that makes the code **easy to understand, maintain, extend, and
test**.

---

## 1. Strategy Pattern

The **Strategy Pattern** is used when we have multiple ways of
performing the same task.

Instead of putting all the logic into one class with many `if-else` or
`switch` statements, we define different strategies and make them
interchangeable.

### Example: Payment System

Suppose an application supports multiple payment methods such as:

- UPI
- Credit Card (CC)
- Other payment methods in the future

Instead of writing all payment logic inside one class, we can define a
common `Payment` interface and create separate implementations.

```text
                    Payment
                 + pay(amount)
                       |
             +---------+---------+
             |                   |
            UPI                 CC
       + pay(amount)       + pay(amount)

                    ^
                    |
             PaymentService
             + makePayment()
                    ^
                    |
                  main()
```

### Basic Flow

1.  Create the required payment object, such as `UPI` or `CC`.
2.  Pass the payment object to `PaymentService`.
3.  `PaymentService` performs the payment operation.
4.  Each payment class knows how its own payment method works.

### Responsibility

- **Payment** → Defines what every payment method must provide.
- **UPI** → Knows how UPI payment works.
- **CC** → Knows how credit-card payment works.
- **PaymentService** → Handles the business operation of making a
    payment.
- **Main** → Creates the required objects and starts the operation.

### Why Strategy Pattern?

It helps us:

- Avoid large `if-else` / `switch` blocks.
- Add new payment methods easily.
- Keep each strategy independent.
- Follow the **Open/Closed Principle**.

---

## 2. SOLID Principles

**SOLID** is a set of five design principles for object-oriented
software. These principles help us write code that is easier to
**maintain, extend, test, and understand**.

The five principles are:

1.  **S --- Single Responsibility Principle (SRP)**
2.  **O --- Open/Closed Principle (OCP)**
3.  **L --- Liskov Substitution Principle (LSP)**
4.  **I --- Interface Segregation Principle (ISP)**
5.  **D --- Dependency Inversion Principle (DIP)**

---

## 2.1 Single Responsibility Principle (SRP)

> A class should have only one responsibility.

In simple words:

**A class should do only one thing.**

For example, a `PaymentService` should handle payment-related business
logic rather than also handling logging, report generation, and database
management.

---

## 2.2 Open/Closed Principle (OCP)

> Software entities should be open for extension but closed for
> modification.

This means we should be able to **add new behavior without modifying
existing, tested code**.

New behavior should preferably be added through a **new implementation
or extension**, rather than repeatedly changing existing code.

### Example

If we already support:

- UPI
- Credit Card

and later want to add:

- PayPal

we should preferably create a new payment implementation instead of
modifying a large existing `if-else` block.

---

## 2.3 Liskov Substitution Principle (LSP)

> A child class should be usable wherever its parent class is expected
> without breaking the correctness of the program.

If `B` is a child of `A`:

```text
A
↑
B
```

Then replacing `A` with `B` should not break the expected behavior of
the program.

The child should honor the behavior expected from the parent.

---

## 2.4 Interface Segregation Principle (ISP)

> Clients should not be forced to depend on methods they do not use.

Instead of creating one large interface containing many unrelated
methods, we should create **smaller and focused interfaces**.

This keeps classes from implementing unnecessary methods.

---

## 2.5 Dependency Inversion Principle (DIP)

> High-level modules should not depend directly on low-level modules.
> Both should depend on abstractions.

In simple words:

```text
High-level module
       ↓
   Abstraction
       ↑
Low-level module
```

This reduces tight coupling between classes.

---

## 3. UML in LLD

**UML (Unified Modeling Language)** is a standard way to visualize and
represent the structure and behavior of a software system.

A common approach while doing LLD is:

```text
Requirements
    ↓
Identify Entities
    ↓
Identify Classes
    ↓
Identify Attributes
    ↓
Identify Methods
    ↓
Identify Relationships
    ↓
Create UML/Class Diagram
    ↓
Model Interactions
    ↓
Create Sequence Diagram
    ↓
Implementation / Code
```

### Things to identify

- Entities
- Classes
- Attributes
- Methods
- Relationships
- Dependencies
- System behavior
- Interaction between objects

### UML Diagrams in these notes

Two important diagrams are:

1.  **Class Diagram**
2.  **Sequence Diagram**

A class diagram mainly represents the **structure** of the system, while
a sequence diagram represents the **interaction between objects over
time**.

---

## 4. Relationships in UML

Classes can have different types of relationships.

## 4.1 Association

**Association** means that two classes are related to each other.

Example:

```text
Student ───── Teacher
```

A student and a teacher can have a relationship without one necessarily
owning the other.

---

## 4.2 Aggregation

**Aggregation** represents a "has-a" relationship where the contained
object can exist independently of the container.

Example:

```text
Department ◇──── Employee
```

A department has employees, but an employee can exist even if the
department is removed.

### Key idea

> The child/object has an independent lifecycle.

---

## 4.3 Composition

**Composition** is a stronger form of aggregation.

The contained object is strongly owned by the parent and generally
cannot exist independently of it.

```text
Parent ◆──── Child
```

### Key idea

> The child depends on the parent for its lifecycle.

---

## 4.4 Dependency

A **dependency** means one class uses another class.

For example, if class `A` uses class `B` as a parameter or temporarily
uses its methods:

```text
A ─────→ B
```

If `A` depends on `B`, changes in `B` may affect `A`.

---

## 4.5 Inheritance

Inheritance represents an **is-a** relationship.

A child class inherits properties and behavior from a parent class.

```text
      A
      ↑
      B
```

Here, `B` is a child/subclass of `A`.

---

## 4.6 Realization

**Realization** represents implementation of an interface by a class.

```text
Interface
     △
     |
   Class
```

In simple terms:

> A class promises to provide the behavior defined by an interface.

---

## 5. Abstraction and Encapsulation

## 5.1 Abstraction

**Abstraction means hiding unnecessary implementation details and
exposing only what is required.**

For example, when using a car, we know how to:

- Start the car
- Accelerate
- Brake

but we do not need to know all the internal engine details.

### Example

```text
Car
 ├── start()
 ├── accelerate()
 └── brake()
```

The user interacts with the required operations without needing to know
their internal implementation.

### Benefits

1.  Hides implementation details.
2.  Focuses on what an object does.
3.  Reduces complexity.
4.  Makes the system easier to understand.

---

## 5.2 Encapsulation

**Encapsulation means bundling data and the methods that operate on that
data together, while controlling direct access to the data.**

For example:

```text
Employee
 ├── name
 ├── salary
 ├── getSalary()
 └── setSalary()
```

The internal data can be protected and accessed through controlled
methods.

### Benefits

- Protects data.
- Controls how data is accessed or modified.
- Reduces unnecessary exposure of implementation details.

---

## 5.3 Abstraction vs Encapsulation

  -----------------------------------------------------------------------
  Abstraction                         Encapsulation
  ----------------------------------- -----------------------------------
  Focuses on **what** an object does  Focuses on **how data is
                                      protected/bundled**

  Hides implementation details        Controls access to data and
                                      behavior

  Reduces complexity                  Improves data protection and
                                      modularity

  Commonly achieved using             Commonly achieved using classes and
  interfaces/abstract classes         access modifiers
  -----------------------------------------------------------------------

---

## 6. Inheritance

**Inheritance** allows a class to acquire properties and behavior from
another class.

```text
       Parent
       /    \
   Child1  Child2
```

Inheritance represents an **is-a relationship**.

For example:

```text
Animal
  ↑
 Dog
```

A `Dog` is an `Animal`.

---

## 7. Types of Inheritance

There are commonly five types of inheritance discussed in LLD/OOP:

1.  Single Inheritance
2.  Multilevel Inheritance
3.  Multiple Inheritance
4.  Hierarchical Inheritance
5.  Hybrid Inheritance

---

## 7.1 Single Inheritance

One child class inherits from one parent class.

```text
Parent
  ↑
Child
```

---

## 7.2 Multilevel Inheritance

A class inherits from another child class, creating multiple levels.

```text
A
↑
B
↑
C
```

Here:

- `B` inherits from `A`
- `C` inherits from `B`

---

## 7.3 Multiple Inheritance

One child class inherits from multiple parent classes.

```text
   A       B
    \     /
      \ /
      C
```

Some languages, such as Java, do not support multiple inheritance of
classes directly because of ambiguity issues, but similar behavior can
be achieved using interfaces.

---

## 7.4 Hierarchical Inheritance

Multiple child classes inherit from the same parent.

```text
       Parent
       /    \
   Child1  Child2
```

---

## 7.5 Hybrid Inheritance

Hybrid inheritance is a combination of two or more types of inheritance.

Example:

```text
        Base
       /    \
    Child1  Child2
       \    /
        Child3
```

The exact form depends on the combination of inheritance types being
used.

---

## 8. Polymorphism

**Polymorphism** means "many forms."

It allows the same interface or method name to behave differently
depending on the situation.

There are two important forms:

1.  **Static Polymorphism**
2.  **Dynamic Polymorphism**

---

## 8.1 Static Polymorphism

Static polymorphism is commonly achieved through **method overloading**.

The same method name can have different parameters.

```text
add(int a, int b)
add(int a, int b, int c)
add(double a, double b)
```

The compiler determines which method should be called.

### Key points

- Same method name.
- Different parameters.
- Resolved at **compile time**.
- Also known as **method overloading**.

---

## 8.2 Dynamic Polymorphism

Dynamic polymorphism is commonly achieved through **method overriding**.

A child class provides its own implementation of a method that already
exists in the parent class.

```text
Parent
  └── method()

Child
  └── method()  ← own implementation
```

### Key points

- Parent and child have the same method signature.
- Child provides its own implementation.
- Resolved at **runtime**.
- Also known as **method overriding**.

---

## 8.3 Overloading vs Overriding

  Method Overloading              Method Overriding
  ------------------------------- -------------------------------
  Static polymorphism             Dynamic polymorphism
  Same method name                Same method signature
  Different parameters            Child redefines parent method
  Compile-time resolution         Runtime resolution
  Usually within the same class   Requires inheritance

---

## 9. Quick LLD Revision

```text
LLD
│
├── Design Patterns
│   └── Strategy Pattern
│
├── SOLID
│   ├── SRP
│   ├── OCP
│   ├── LSP
│   ├── ISP
│   └── DIP
│
├── UML
│   ├── Class Diagram
│   └── Sequence Diagram
│
├── Relationships
│   ├── Association
│   ├── Aggregation
│   ├── Composition
│   ├── Dependency
│   ├── Inheritance
│   └── Realization
│
├── OOP Concepts
│   ├── Abstraction
│   ├── Encapsulation
│   ├── Inheritance
│   └── Polymorphism
│
└── Inheritance Types
    ├── Single
    ├── Multilevel
    ├── Multiple
    ├── Hierarchical
    └── Hybrid
```

## Core Idea

While designing an LLD, the goal is not just to make the code work. The
goal is to structure the system so that **responsibilities are clear,
dependencies are manageable, new behavior can be added easily, and
existing code does not need unnecessary changes**.